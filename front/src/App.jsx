import { useEffect, useState } from 'react'
import { Content } from './components/layout/Content'
import { Header } from './components/layout/Header'
import { Sidebar } from './components/layout/Sidebar'
import { ItemDetailModal } from './components/item/ItemDetailModal'
import { ItemFormModal } from './components/item/ItemFormModal'
import { LocationFormModal } from './components/location/LocationFormModal'
import { LocationManageModal } from './components/location/LocationManageModal'
import { MobileLocationBar } from './components/location/MobileLocationBar'
import { users } from './data/users'
import { useAppUi } from './hooks/useAppUi'
import { useInventory } from './hooks/useInventory'
import { useVisibleItems } from './hooks/useVisibleItems'

export const App = () => {
  // 데이터는 useInventory, 화면 조작 상태는 Zustand를 감싼 useAppUi에서 가져온다.
  const inventory = useInventory()
  const ui = useAppUi()
  const [serverStatus, setServerStatus] = useState('checking')

  useEffect(() => {
    let isActive = true

    const checkServer = async () => {
      try {
        const response = await fetch('/api/health')
        if (!response.ok) throw new Error('Health check failed')
        if (isActive) setServerStatus('connected')
      } catch {
        if (isActive) setServerStatus('disconnected')
      }
    }

    checkServer()
    return () => {
      isActive = false
    }
  }, [])

  // 선택 ID를 기준으로 원본 배열에서 최신 데이터를 다시 찾는다.
  const selectedLocation = inventory.locations.find((location) => location.id === ui.selectedLocationId)
  const selectedItem = inventory.items.find((item) => item.id === ui.selectedItemId)
  const itemFormItem = inventory.items.find((item) => item.id === ui.itemFormItemId)
  const managedLocation = inventory.locations.find((location) => location.id === ui.managedLocationId)
  const createdBy = users.find((user) => user.id === selectedItem?.createdBy)
  const updatedBy = users.find((user) => user.id === selectedItem?.updatedBy)

  // 목록 표시 규칙은 App 밖의 훅에 둬서, 이 파일은 화면 연결에만 집중한다.
  const visibleItems = useVisibleItems({
    items: inventory.items,
    locations: inventory.locations,
    selectedLocationId: ui.selectedLocationId,
    searchKeyword: ui.searchKeyword,
    sortOption: ui.sortOption,
  })

  // 새 위치를 만든 직후 그 위치를 선택해, 사용자가 결과를 바로 확인하게 한다.
  const createLocation = async (locationValues) => {
    const newLocation = await inventory.createLocation(locationValues)
    ui.selectLocation(newLocation.id)
  }

  const openItemEditor = (itemId) => {
    ui.clearSelectedItem()
    ui.openItemForm(itemId)
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-500">
      <Header
        searchKeyword={ui.searchKeyword}
        onSearchKeywordChange={ui.setSearchKeyword}
        serverStatus={serverStatus}
      />
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <Sidebar
          locations={inventory.locations}
          selectedLocationId={ui.selectedLocationId}
          onSelectLocation={ui.selectLocation}
          onOpenLocationForm={() => ui.openLocationForm(ui.selectedLocationId)}
          onOpenLocationManage={ui.openLocationManage}
        />
        <MobileLocationBar
          locations={inventory.locations}
          selectedLocationId={ui.selectedLocationId}
          onSelectLocation={ui.selectLocation}
          onOpenLocationForm={() => ui.openLocationForm(ui.selectedLocationId)}
          onOpenLocationManage={ui.openLocationManage}
        />
        <Content
          items={visibleItems}
          selectedLocationName={selectedLocation?.name}
          searchKeyword={ui.searchKeyword}
          sortOption={ui.sortOption}
          onSortOptionChange={ui.setSortOption}
          onSelectItem={ui.selectItem}
          onOpenItemForm={ui.openItemForm}
        />
        {inventory.isLoading && <div className="fixed inset-x-0 bottom-4 z-40 mx-auto w-fit rounded-full bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">데이터를 불러오는 중</div>}
        {inventory.error && <button type="button" onClick={inventory.reload} className="fixed inset-x-0 bottom-4 z-40 mx-auto w-fit rounded-full bg-red-600 px-4 py-2 text-sm text-white shadow-lg">{inventory.error} · 다시 시도</button>}
      </div>
      {/* 선택·열림 상태가 있을 때만 해당 모달을 화면에 추가한다. */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          createdByName={createdBy?.name ?? '알 수 없음'}
          updatedByName={updatedBy?.name ?? '알 수 없음'}
          onEdit={() => openItemEditor(selectedItem.id)}
          onDelete={() => inventory.deleteItem(selectedItem.id)}
          onClose={ui.clearSelectedItem}
        />
      )}
      {ui.isItemFormOpen && (
        <ItemFormModal
          item={itemFormItem}
          locations={inventory.locations}
          onCreateItem={inventory.createItem}
          onUpdateItem={inventory.updateItem}
          onClose={ui.closeItemForm}
        />
      )}
      {ui.isLocationFormOpen && (
        <LocationFormModal
          locations={inventory.locations}
          initialParentId={ui.locationFormParentId}
          onCreateLocation={createLocation}
          onClose={ui.closeLocationForm}
        />
      )}
      {ui.isLocationManageOpen && managedLocation && (
        <LocationManageModal
          location={managedLocation}
          locations={inventory.locations}
          items={inventory.items}
          onUpdateLocation={inventory.updateLocation}
          onDeleteLocation={inventory.deleteLocation}
          onDeleteLocationWithItemMoves={inventory.deleteLocationWithItemMoves}
          onAfterDelete={(parentId) => ui.selectLocation(parentId)}
          onClose={ui.closeLocationManage}
        />
      )}
    </div>
  )
}
