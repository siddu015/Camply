import { ComingSoon } from "../components/coming-soon"

export function CurrentSemester() {
  return (
    <div className="animate-in fade-in-50 duration-300 slide-in-from-bottom-2 w-full">
      <ComingSoon title="Current Semester" description="Current Semester features are under development" />
    </div>
  )
}

export default CurrentSemester