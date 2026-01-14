/**
 * Pure-local CLI: connection to Codebuff backend is not required.
 */
export const useConnectionStatus = (
  _onReconnect?: (isInitialConnection: boolean) => void,
) => {
  return true
}
