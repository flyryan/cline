import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import * as vscode from "vscode";
import { ClineProvider } from "./ClineProvider";
import { Cline } from "../Cline";
import { COMMAND_REQ_APP_STRING } from "../../shared/combineCommandSequences";
import { WebviewMessage } from "../../shared/WebviewMessage";
import { ClineAsk } from "../../shared/ExtensionMessage";
import { ClineAskResponse } from "../../shared/WebviewMessage";

jest.mock("vscode");
jest.mock("../Cline");

// Use Jest's Mocked type for better type safety
const mockedVscode = jest.mocked(vscode, true);

// Mock VSCode APIs
const mockShowInputBox = jest.fn().mockImplementation(async () => undefined);
const mockOnDidReceiveMessage = jest.fn();

// Assign the mock functions to the mockedVscode
mockedVscode.window.showInputBox = mockShowInputBox;
mockedVscode.window.onDidReceiveMessage = mockOnDidReceiveMessage;

describe("ClineProvider", () => {
    let provider: ClineProvider;
    let mockOutputChannel: vscode.OutputChannel;
    let mockContext: vscode.ExtensionContext;
    let mockWebview: vscode.Webview;

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();

        // Setup mocks
        mockOutputChannel = {
            appendLine: jest.fn(),
            dispose: jest.fn(),
        } as unknown as vscode.OutputChannel;

        mockContext = {
            extensionUri: {} as vscode.Uri,
            globalState: {
                get: jest.fn(),
                update: jest.fn(),
            },
            secrets: {
                get: jest.fn(),
                store: jest.fn(),
                delete: jest.fn(),
            },
        } as unknown as vscode.ExtensionContext;

        const onDidReceiveMessageHandler = (handler: (message: WebviewMessage) => void) => {
            mockOnDidReceiveMessage.mockImplementation((msg: WebviewMessage) => handler(msg));
            return { dispose: jest.fn() };
        };

        mockWebview = {
            postMessage: jest.fn(),
            onDidReceiveMessage: onDidReceiveMessageHandler,
        } as unknown as vscode.Webview;

        provider = new ClineProvider(mockContext, mockOutputChannel);
    });

    describe("command editing", () => {
        it("should handle editCommand message with approval requirements", async () => {
            const originalCommand = `npm install${COMMAND_REQ_APP_STRING}`;
            const editedCommand = "npm install --save-dev" as string;

            // Setup mock input box to return edited command
            mockShowInputBox.mockResolvedValueOnce(editedCommand);

            // Create message that would come from webview
            const message: WebviewMessage = {
                type: "editCommand",
                command: "npm install",
                originalCommand,
            };

            // Mock cline instance
            const mockAsk = jest.fn().mockResolvedValue({ response: "yesButtonClicked" as ClineAskResponse });
            const mockCline = {
                ask: mockAsk,
                taskId: "test-task-id",
                terminalManager: {},
                urlContentFetcher: {},
                browserSession: {},
                didEditFile: false,
                customInstructions: undefined,
                autoApprovalSettings: {},
                apiConversationHistory: [],
                clineMessages: [],
                abortTask: jest.fn(),
                handleWebviewAskResponse: jest.fn(),
                say: jest.fn(),
            } as unknown as Cline;

            provider["cline"] = mockCline;

            // Simulate message from webview
            provider["setWebviewMessageListener"](mockWebview);
            mockOnDidReceiveMessage(message);

            // Verify input box was shown with correct initial value
            expect(mockShowInputBox).toHaveBeenCalledWith({
                value: "npm install",
                prompt: "Edit command",
                placeHolder: "Enter command",
                validateInput: expect.any(Function),
            });

            // Verify edited command was sent with approval requirement preserved
            expect(mockAsk).toHaveBeenCalledWith(
                "command",
                `${editedCommand}${COMMAND_REQ_APP_STRING}`
            );
        });

        it("should handle editCommand message without approval requirements", async () => {
            const originalCommand = "ls -la";
            const editedCommand = "ls -la src/" as string;
            
            mockShowInputBox.mockResolvedValueOnce(editedCommand);

            const message: WebviewMessage = {
                type: "editCommand",
                command: originalCommand,
                originalCommand,
            };

            const mockAsk = jest.fn().mockResolvedValue({ response: "yesButtonClicked" as ClineAskResponse });
            const mockCline = {
                ask: mockAsk,
                taskId: "test-task-id",
                terminalManager: {},
                urlContentFetcher: {},
                browserSession: {},
                didEditFile: false,
                customInstructions: undefined,
                autoApprovalSettings: {},
                apiConversationHistory: [],
                clineMessages: [],
                abortTask: jest.fn(),
                handleWebviewAskResponse: jest.fn(),
                say: jest.fn(),
            } as unknown as Cline;

            provider["cline"] = mockCline;

            provider["setWebviewMessageListener"](mockWebview);
            await Promise.resolve(mockOnDidReceiveMessage(message));

            expect(mockAsk).toHaveBeenCalledWith(
                "command",
                editedCommand
            );
        });

        it("should validate command is not empty", async () => {
            const message: WebviewMessage = {
                type: "editCommand",
                command: "test command",
                originalCommand: "test command",
            };

            provider["setWebviewMessageListener"](mockWebview);
            await Promise.resolve(mockOnDidReceiveMessage(message));

            const validateInput = mockShowInputBox.mock.calls[0][0].validateInput as (value: string) => string | null;
            
            expect(validateInput("")).toBe("Command cannot be empty");
            expect(validateInput("valid command")).toBeNull();
        });

        it("should do nothing if user cancels edit", async () => {
            mockShowInputBox.mockResolvedValueOnce(undefined);

            const message: WebviewMessage = {
                type: "editCommand",
                command: "test command",
                originalCommand: "test command",
            };

            const mockAsk = jest.fn().mockResolvedValue({ response: "yesButtonClicked" as ClineAskResponse });
            const mockCline = {
                ask: mockAsk,
                taskId: "test-task-id",
                terminalManager: {},
                urlContentFetcher: {},
                browserSession: {},
                didEditFile: false,
                customInstructions: undefined,
                autoApprovalSettings: {},
                apiConversationHistory: [],
                clineMessages: [],
                abortTask: jest.fn(),
                handleWebviewAskResponse: jest.fn(),
                say: jest.fn(),
            } as unknown as Cline;

            provider["cline"] = mockCline;

            provider["setWebviewMessageListener"](mockWebview);
            await Promise.resolve(mockOnDidReceiveMessage(message));

            expect(mockAsk).not.toHaveBeenCalled();
        });
    });
})