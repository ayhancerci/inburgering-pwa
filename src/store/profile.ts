// Single shared profile — the couple uses one account, so there is no switcher.
// Kept as a hook-shaped helper so feature code keeps using `useActiveProfile().activeId`
// and we could reintroduce multiple profiles later without touching every component.
const ACTIVE_PROFILE_ID = 'him'

export function useActiveProfile(): { activeId: string } {
  return { activeId: ACTIVE_PROFILE_ID }
}
