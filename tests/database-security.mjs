import { PGlite } from '@electric-sql/pglite'
import { readFile, readdir } from 'node:fs/promises'
import assert from 'node:assert/strict'
import { test } from 'node:test'

test('전체 마이그레이션과 공동체 격리·계층·배치·기록 검증', async () => {
  const db = new PGlite()
  try {
    // 운영 계정과 무관한 메모리 DB. Supabase Auth의 최소 인터페이스만 준비한다.
    await db.exec(`
      create role anon; create role authenticated;
      create schema auth;
      create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
      create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    `)
    const directory = new URL('../supabase/migrations/', import.meta.url)
    for (const file of (await readdir(directory)).filter((name) => name.endsWith('.sql')).sort()) {
      try { await db.exec(await readFile(new URL(file, directory), 'utf8')) }
      catch (error) { throw new Error(`${file}: ${error.message}`, { cause: error }) }
    }
    const userA = '00000000-0000-4000-8000-000000000001'
    const userB = '00000000-0000-4000-8000-000000000002'
    await db.query(`insert into auth.users(id,email) values ($1,'alpha@example.test'),($2,'bravo@example.test')`, [userA, userB])
    const homes = (await db.query('select home_id, user_id from home_members order by user_id')).rows
    const a = homes[0].home_id
    const b = homes[1].home_id
    const location = async (home, name, parent = null) => (await db.query(
      'insert into locations(home_id,name,parent_id) values($1,$2,$3) returning id', [home, name, parent],
    )).rows[0].id
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [userA])
    const room = await location(a, '거실')
    const child = await location(a, '서랍', room)
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [userB])
    const foreign = await location(b, '비공개 방')
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [userA])

    await assert.rejects(location(a, '잘못된 부모', foreign))
    await assert.rejects(db.query('update locations set parent_id=$1 where id=$1', [room]))
    await assert.rejects(db.query('update locations set parent_id=$1 where id=$2', [child, room]))
    await assert.rejects(db.query('insert into items(home_id,title,location_id) values($1,$2,$3)', [a, '공격', foreign]))
    await assert.rejects(db.query('select activity_location_snapshot($1)', [foreign]), /권한/)
    await assert.rejects(db.query("insert into space_layouts(home_id,scene_location_id,layout_key,view_kind,width_cm,height_cm,depth_cm) values($1,$2,'bad','interior',100,100,100)", [a, foreign]))

    const layout = (await db.query("insert into space_layouts(home_id,layout_key,view_kind,width_cm,height_cm,depth_cm) values($1,'home','plan',600,250,300) returning id", [a])).rows[0].id
    await db.query('insert into space_placements(layout_id,location_id,x_cm,y_cm,z_cm,width_cm,height_cm,depth_cm) values($1,$2,0,0,0,300,250,300)', [layout, room])
    const dimensions = (await db.query('select width_cm,height_cm,depth_cm from space_layouts where scene_location_id=$1', [room])).rows[0]
    assert.deepEqual(dimensions, { width_cm: 300, height_cm: 250, depth_cm: 300 })
    const second = await location(a, '부엌')
    await assert.rejects(db.query('insert into space_placements(layout_id,location_id,x_cm,y_cm,z_cm,width_cm,height_cm,depth_cm) values($1,$2,299,0,0,100,100,100)', [layout, second]), /이미/)
    await db.query('insert into space_placements(layout_id,location_id,x_cm,y_cm,z_cm,width_cm,height_cm,depth_cm) values($1,$2,300,0,0,100,100,100)', [layout, second])
    await assert.rejects(db.query("insert into scene_structures(layout_id,kind,name,x_cm,y_cm,z_cm,width_cm,height_cm,depth_cm) values($1,'window','겹침',350,0,0,10,100,100)", [layout]), /이미/)
    await assert.rejects(db.query('update space_layouts set width_cm=200 where id=$1', [layout]), /벗어/)
    await db.query("insert into scene_structures(layout_id,kind,name,x_cm,y_cm,z_cm,width_cm,height_cm,depth_cm) values($1,'wall','벽',500,0,0,10,250,300)", [layout])

    const item = (await db.query('insert into items(home_id,title,location_id) values($1,$2,$3) returning id', [a, '테스트 물건', child])).rows[0].id
    await db.query('select delete_location_with_items($1,$2,$3)', [child, 'move', room])
    assert.equal((await db.query('select location_id from items where id=$1', [item])).rows[0].location_id, room)
    const events = (await db.query("select count(*)::int as count from activity_events where entity_id=$1 and action='moved'", [item])).rows[0].count
    assert.equal(events, 1)
    await assert.rejects(db.query('insert into items(home_id,title,location_id) values($1,$2,$3)', [a, '삭제된 공간', child]))

    // 실제 API 역할로 RLS 확인. 다른 공동체 UUID를 알아도 조회/수정할 수 없다.
    await db.exec('grant usage on schema public, auth to authenticated; grant select, insert, update, delete on all tables in schema public to authenticated; set role authenticated;')
    assert.equal((await db.query('select id from locations where home_id=$1', [b])).rows.length, 0)
    assert.equal((await db.query("update locations set name='변조' where id=$1 returning id", [foreign])).rows.length, 0)
    await assert.rejects(db.query('select activity_location_snapshot($1)', [foreign]), /permission denied/)
  } finally {
    await db.close()
  }
})
