
import { Skeleton } from "@/components/ui/skeleton";
import { BookHeadphones } from "lucide-react"; // Assuming this is your logo icon

export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)] space-y-8">
      {/* Placeholder for Logo */}
      <div className="flex flex-col items-center mb-8 animate-pulse">
        <BookHeadphones className="h-24 w-24 text-primary/30" /> 
        <Skeleton className="h-6 w-48 mt-4 bg-primary/20" />
      </div>

      <div className="w-full max-w-md space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-4 w-3/4 mx-auto" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 w-full max-w-4xl">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border bg-card/50 text-card-foreground shadow-sm p-6 opacity-50">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-5 w-5 rounded-full" />
            </div>
            <div>
              <Skeleton className="h-8 w-1/4 mb-1" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
      
      <div className="rounded-lg border bg-card/50 text-card-foreground shadow-sm mt-8 w-full max-w-4xl opacity-50">
        <div className="p-6">
          <Skeleton className="h-6 w-1/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-6" />
        </div>
        <div className="p-6 pt-0 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </div>
      <p className="text-muted-foreground text-lg">Loading your NEET Prep+ Dashboard...</p>
    </div>
  );
}
