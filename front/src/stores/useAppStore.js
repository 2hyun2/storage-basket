import { create } from 'zustand'

export const useAppStore = create((set) => ({
  // 레이아웃, 
  selectedLocationId: null, // sidebar - selected value if null: all
  searchKeyword: '', // header - search value
  // 물건 정렬
  sortOption: 'updated-desc', // sort option
  // 물건 상세보지 모달 
  selectedItemId: null, // 상세 모달에서 보고 있는 물건 ID. null이면 상세 모달을 닫는다.
  isItemFormOpen: false, // 물건 등록 모달의 표시 여부.
  itemFormItemId: null,
  // 위치 등록
  isLocationFormOpen: false, // 위치 등록 모달의 표시 여부.
  locationFormParentId: null, // 새 위치의 부모가 될 치 ID. null이면 최상위 위치를 만든다.
  isLocationManageOpen: false,
  managedLocationId: null,

  // 선택 위치를 바꿔 목록 필터와 사이드바 강조 상태를 함께 갱신한다.
  selectLocation: (locationId) => set({ selectedLocationId: locationId }),
  // 검색창에서 입력한 문자열을 저장한다.
  setSearchKeyword: (searchKeyword) => set({ searchKeyword }),
  // 목록 정렬 선택값을 변경한다.
  setSortOption: (sortOption) => set({ sortOption }),
  // 카드에서 선택한 물건의 ID를 저장해 상세 모달을 연다.
  selectItem: (itemId) => set({ selectedItemId: itemId }),
  // 선택한 물건을 비워 상세 모달을 닫는다
  clearSelectedItem: () => set({ selectedItemId: null }),
  // 물건 등록 모달을 연다.
  openItemForm: (itemId = null) => set({ isItemFormOpen: true, itemFormItemId: itemId }),
  // 물건 등록 모달을 닫는다
  closeItemForm: () => set({ isItemFormOpen: false, itemFormItemId: null }),
  // 위치 등록 모달을 열고, 선택적으로 새 위치의 부모 ID를 저장한다.
  openLocationForm: (parentId = null) => set({ isLocationFormOpen: true, locationFormParentId: parentId }),
  // 위치 등록 모달을 닫고 다음 등록을 위해 부모 ID도 초기화한다.
  closeLocationForm: () => set({ isLocationFormOpen: false, locationFormParentId: null }),
  // 선택한 위치의 이름·상위 위치·삭제를 관리하는 모달을 연다.
  openLocationManage: (locationId) => set({ isLocationManageOpen: true, managedLocationId: locationId }),
  closeLocationManage: () => set({ isLocationManageOpen: false, managedLocationId: null }),
}))
