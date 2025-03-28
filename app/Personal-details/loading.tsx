import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

export default function Loading() {
  return (
    <div className="container max-w-3xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-64" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-full" />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                <Skeleton className="h-4 w-24" />
              </Label>
              <Skeleton className="h-10 w-full" />
            </div>

            <div className="space-y-2">
              <Label>
                <Skeleton className="h-4 w-32" />
              </Label>
              <Skeleton className="h-10 w-full" />
            </div>

            <div className="space-y-2">
              <Label>
                <Skeleton className="h-4 w-36" />
              </Label>
              <Skeleton className="h-24 w-full" />
            </div>

            <div className="space-y-2">
              <Label>
                <Skeleton className="h-4 w-40" />
              </Label>
              <Skeleton className="h-24 w-full" />
            </div>
          </div>

          <div className="space-y-4">
            <Skeleton className="h-6 w-48" />

            <div className="space-y-2">
              <Label>
                <Skeleton className="h-4 w-32" />
              </Label>
              <Skeleton className="h-10 w-full" />
            </div>

            <div className="space-y-2">
              <Label>
                <Skeleton className="h-4 w-32" />
              </Label>
              <Skeleton className="h-10 w-full" />
            </div>

            <div className="space-y-2">
              <Label>
                <Skeleton className="h-4 w-24" />
              </Label>
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-40" />
        </CardFooter>
      </Card>
    </div>
  )
}

