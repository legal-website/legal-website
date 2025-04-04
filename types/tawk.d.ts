interface TawkToAPI {
  // Core methods
  maximize: () => void
  minimize: () => void
  toggle: () => void
  popup: () => void
  getWindowType: () => string
  showWidget: () => void
  hideWidget: () => void
  toggleVisibility: () => void
  getStatus: () => string
  isChatMaximized: () => boolean
  isChatMinimized: () => boolean
  isChatHidden: () => boolean
  isChatOngoing: () => boolean
  isVisitorEngaged: () => boolean
  endChat: () => void

  // Visitor methods
  setAttributes: (attributes: Record<string, string>, callback?: (error: Error | null) => void) => void
  addEvent: (event: string, metadata: any, callback?: (error: Error | null) => void) => void
  addTags: (tags: string[], callback?: (error: Error | null) => void) => void
  removeTags: (tags: string[], callback?: (error: Error | null) => void) => void

  // Event handlers
  onLoad: (() => void) | null
  onStatusChange: ((status: string) => void) | null
  onBeforeLoad: (() => void) | null
  onChatMaximized: (() => void) | null
  onChatMinimized: (() => void) | null
  onChatHidden: (() => void) | null
  onChatStarted: (() => void) | null
  onChatEnded: (() => void) | null
  onPrechatSubmit: ((data: any) => void) | null
  onOfflineSubmit: ((data: any) => void) | null
  onChatMessageVisitor: ((message: string) => void) | null
  onChatMessageAgent: ((message: string) => void) | null
  onChatMessageSystem: ((message: string) => void) | null
  onAgentJoinChat: ((data: any) => void) | null
  onAgentLeaveChat: ((data: any) => void) | null
  onChatSatisfaction: ((satisfaction: string) => void) | null
  onVisitorNameChanged: ((visitorName: string) => void) | null
  onFileUpload: ((data: any) => void) | null
  onTagsUpdated: ((data: string[]) => void) | null

  // Custom properties
  visitor?: {
    name?: string
    email?: string
    [key: string]: any
  }
  customStyle?: {
    zIndex?: number
    [key: string]: any
  }
  language?: string
  [key: string]: any
}

interface Window {
  Tawk_API?: TawkToAPI
  Tawk_LoadStart?: Date
}

