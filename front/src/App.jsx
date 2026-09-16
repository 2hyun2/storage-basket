import { Content } from './components/layout/Content'
import { Header } from './components/layout/Header'
import { Sidebar } from './components/layout/Sidebar'
import { ItemDetailModal } from './components/item/ItemDetailModal'
import { ItemFormModal } from './components/item/ItemFormModal'
import { LocationFormModal } from './components/location/LocationFormModal'
import { users } from './data/users'
import { useAppUi } from './hooks/useAppUi'
import { useInventory } from './hooks/useInventory'
import { useVisibleItems } from './hooks/useVisibleItems'

export const App = () => {
  // 데이터는 useInventory, 화면 조작 상태는 Zustand를 감싼 useAppUi에서 가져온다.
  const inventory = useInventory()
  const ui = useAppUi()

  // 선택 ID를 기준으로 원본 배열에서 최신 데이터를 다시 찾는다.
  const selectedLocation = inventory.locations.find((location) => location.id === ui.selectedLocationId)
  const selectedItem = inventory.items.find((item) => item.id === ui.selectedItemId)
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
  const createLocation = (locationValues) => {
    const newLocation = inventory.createLocation(locationValues)
    ui.selectLocation(newLocation.id)
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-500">
      <Header searchKeyword={ui.searchKeyword} onSearchKeywordChange={ui.setSearchKeyword} />
      <div className="flex min-h-0 flex-1">
        <Sidebar
          locations={inventory.locations}
          selectedLocationId={ui.selectedLocationId}
          onSelectLocation={ui.selectLocation}
          onOpenLocationForm={() => ui.openLocationForm(ui.selectedLocationId)}
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
      </div>
      {/* 선택·열림 상태가 있을 때만 해당 모달을 화면에 추가한다. */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          createdByName={createdBy?.name ?? '알 수 없음'}
          updatedByName={updatedBy?.name ?? '알 수 없음'}
          onClose={ui.clearSelectedItem}
        />
      )}
      {ui.isItemFormOpen && (
        <ItemFormModal locations={inventory.locations} onCreateItem={inventory.createItem} onClose={ui.closeItemForm} />
      )}
      {ui.isLocationFormOpen && (
        <LocationFormModal
          locations={inventory.locations}
          initialParentId={ui.locationFormParentId}
          onCreateLocation={createLocation}
          onClose={ui.closeLocationForm}
        />
      )}
    </div>
  )
}
