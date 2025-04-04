interface TawkToAPI {
    maximize: () => void
    minimize: () => void
    toggle: () => void
    popup: () => void
    showWidget: () => void
    hideWidget: () => void
    toggleVisibility: () => void
    endChat: () => void
    isChatMaximized: () => boolean
    isChatMinimized: () => boolean
    isChatHidden: () => boolean
    isChatOngoing: () => boolean
    isVisitorEngaged: () => boolean
    onLoaded: (callback: () => void) => void
    onLoad: () => void
    onStatusChange: (callback: (status: string) => void) => void
    onChatMaximized: (callback: () => void) => void
    onChatMinimized: (callback: () => void) => void
    onChatHidden: (callback: () => void) => void
    onChatStarted: (callback: () => void) => void
    onChatEnded: (callback: () => void) => void
    onPrechatSubmit: (callback: (data: any) => void) => void
    onOfflineSubmit: (callback: (data: any) => void) => void
    addEvent: (event: string, metadata: any, callback: () => void) => void
    addTags: (tags: string[], callback: () => void) => void
    removeTags: (tags: string[], callback: () => void) => void
    setAttributes: (attributes: Record<string, string>, callback: (error: any) => void) => void
    visitor: {
      name: string
      email: string
    }
  }
  
  declare global {
    interface Window {
      Tawk_API?: TawkToAPI
      Tawk_LoadStart?: Date
    }
  }
  
  export {}
  
  