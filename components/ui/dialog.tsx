"use client"

import * as React from "react"
import { X } from "lucide-react"

type DialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  return open ? <>{children}</> : null
}

type DialogTriggerProps = {
  asChild?: boolean
  children: React.ReactNode
  onClick?: () => void
}

export function DialogTrigger({ children, onClick }: DialogTriggerProps) {
  return React.cloneElement(children as React.ReactElement, {
    onClick,
  })
}

type DialogContentProps = {
  className?: string
  children: React.ReactNode
}

export function DialogContent({ className, children }: DialogContentProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg max-w-md w-full relative ${className}`}>
        {children}
      </div>
    </div>
  )
}

type DialogHeaderProps = {
  className?: string
  children: React.ReactNode
}

export function DialogHeader({ className, children }: DialogHeaderProps) {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  )
}

type DialogFooterProps = {
  className?: string
  children: React.ReactNode
}

export function DialogFooter({ className, children }: DialogFooterProps) {
  return (
    <div className={`flex justify-end gap-2 mt-6 ${className}`}>
      {children}
    </div>
  )
}

type DialogTitleProps = {
  className?: string
  children: React.ReactNode
}

export function DialogTitle({ className, children }: DialogTitleProps) {
  return (
    <h2 className={`text-lg font-semibold ${className}`}>
      {children}
    </h2>
  )
}

type DialogDescriptionProps = {
  className?: string
  children: React.ReactNode
}

export function DialogDescription({ className, children }: DialogDescriptionProps) {
  return (
    <p className={`text-sm text-muted-foreground mt-1 ${className}`}>
      {children}
    </p>
  )
}

export function DialogClose() {
  return null
}

export const DialogPortal = ({ children }: { children: React.ReactNode }) => children
export const DialogOverlay = () => null
