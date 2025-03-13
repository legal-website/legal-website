"use client"

import { DialogFooter } from "@/components/ui/dialog"

import type React from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface UserDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: any // Replace 'any' with your actual User type
}

const UserDetailsDialog: React.FC<UserDetailsDialogProps> = ({ open, onOpenChange, user }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>Detailed information about {user?.name}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* User Profile */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3">
              <Card className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-4">
                    {user?.profileImage ? (
                      <AvatarImage src={user?.profileImage || "/placeholder.svg"} alt={user?.name} />
                    ) : (
                      <AvatarFallback className="text-lg">
                        {user?.name
                          ?.split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    )}
                  </div>
                  <h3 className="text-lg font-medium">{user?.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{user?.email}</p>
                </div>
              </Card>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default UserDetailsDialog

