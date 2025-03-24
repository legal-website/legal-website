declare module "cmdk" {
  export interface CommandProps extends React.HTMLAttributes<HTMLDivElement> {
    onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void
    children: React.ReactNode
    label?: string
    shouldFilter?: boolean
    filter?: (value: string, search: string) => boolean
    value?: string
    onValueChange?: (value: string) => void
    loop?: boolean
    className?: string
    id?: string
  }

  export interface CommandInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onValueChange?: (value: string) => void
    value?: string
    placeholder?: string
    className?: string
  }

  type CommandListProps = {
    children: React.ReactNode
    className?: string
  } & React.HTMLAttributes<HTMLDivElement>

  type CommandEmptyProps = {
    children: React.ReactNode
    className?: string
  } & React.HTMLAttributes<HTMLDivElement>

  type CommandGroupProps = {
    children: React.ReactNode
    heading?: React.ReactNode
    className?: string
    headingClassName?: string
  } & React.HTMLAttributes<HTMLDivElement>

  export interface CommandItemProps extends React.HTMLAttributes<HTMLDivElement> {
    onSelect?: () => void
    children: React.ReactNode
    disabled?: boolean
    value?: string
    className?: string
  }

  type CommandSeparatorProps = {
    className?: string
  } & React.HTMLAttributes<HTMLDivElement>

  type CommandDialogProps = {
    children: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
    className?: string
    overlayClassName?: string
    contentClassName?: string
  }

  export const Command: React.ForwardRefExoticComponent<CommandProps & React.RefAttributes<HTMLDivElement>> & {
    Input: React.ForwardRefExoticComponent<CommandInputProps & React.RefAttributes<HTMLInputElement>>
    List: React.FC<CommandListProps>
    Empty: React.FC<CommandEmptyProps>
    Group: React.FC<CommandGroupProps>
    Item: React.FC<CommandItemProps>
    Separator: React.FC<CommandSeparatorProps>
    Dialog: React.FC<CommandDialogProps>
  }

  export default Command
}

