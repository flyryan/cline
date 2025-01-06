import { ApiConfiguration } from "./api"
import { AutoApprovalSettings } from "./AutoApprovalSettings"

export interface WebviewMessage {
	type:
		| "apiConfiguration"
		| "customInstructions"
		| "editCommand" // Message sent when user wants to edit a command
		| "webviewDidLaunch"
		| "newTask"
		| "askResponse"
		| "clearTask"
		| "didShowAnnouncement"
		| "selectImages"
		| "exportCurrentTask"
		| "showTaskWithId"
		| "deleteTaskWithId"
		| "exportTaskWithId"
		| "resetState"
		| "requestOllamaModels"
		| "requestLmStudioModels"
		| "openImage"
		| "openFile"
		| "openMention"
		| "cancelTask"
		| "refreshOpenRouterModels"
		| "openMcpSettings"
		| "restartMcpServer"
		| "autoApprovalSettings"
	text?: string
	askResponse?: ClineAskResponse
	apiConfiguration?: ApiConfiguration
	images?: string[]
	bool?: boolean
	autoApprovalSettings?: AutoApprovalSettings
	// Properties for command editing
	command?: string      // The command to be edited
	originalCommand?: string  // Original command with approval requirements
}

export type ClineAskResponse = "yesButtonClicked" | "noButtonClicked" | "messageResponse"
