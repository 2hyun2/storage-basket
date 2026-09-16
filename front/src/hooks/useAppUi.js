import { useShallow } from 'zustand/shallow'
import { useAppStore } from '../stores/useAppStore'

// 화면 선택·검색·모달 상태를 한 곳으로 모아 App이 store 구현을 알 필요 없게 한다.
export const useAppUi = () =>
  useAppStore(
    useShallow((state) => ({
      selectedLocationId: state.selectedLocationId,
      selectLocation: state.selectLocation,
      searchKeyword: state.searchKeyword,
      setSearchKeyword: state.setSearchKeyword,
      sortOption: state.sortOption,
      setSortOption: state.setSortOption,
      selectedItemId: state.selectedItemId,
      selectItem: state.selectItem,
      clearSelectedItem: state.clearSelectedItem,
      isItemFormOpen: state.isItemFormOpen,
      itemFormItemId: state.itemFormItemId,
      openItemForm: state.openItemForm,
      closeItemForm: state.closeItemForm,
      isLocationFormOpen: state.isLocationFormOpen,
      locationFormParentId: state.locationFormParentId,
      openLocationForm: state.openLocationForm,
      closeLocationForm: state.closeLocationForm,
      isLocationManageOpen: state.isLocationManageOpen,
      managedLocationId: state.managedLocationId,
      openLocationManage: state.openLocationManage,
      closeLocationManage: state.closeLocationManage,
    })),
  )
