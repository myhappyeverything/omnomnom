/** Widget token fields safe to send to the client — never the raw token or its hash. */
export interface PublicWidgetToken {
  id: string
  label: string
  lastUsedAt: string | null
  createdAt: string
}

/** The raw token is only ever present in the response to the mint call that created it. */
export interface IssuedWidgetToken extends PublicWidgetToken {
  token: string
}
