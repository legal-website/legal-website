import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Loading() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-40" />
      </div>

      <Tabs defaultValue="bank">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="bank" disabled>
            Bank Accounts
          </TabsTrigger>
          <TabsTrigger value="mobile_wallet" disabled>
            Mobile Wallets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bank" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j}>
                        <Skeleton className="h-4 w-1/3 mb-1" />
                        <Skeleton className="h-5 w-full" />
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-20" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

