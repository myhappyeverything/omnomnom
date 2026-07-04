import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { LoginInput, PublicUser, RegisterInput } from '@omnomnom/shared'
import * as authApi from '@/api/auth'
import { tryRestoreSession } from '@/api/client'

interface AuthContextValue {
  user: PublicUser | null
  isLoading: boolean
  login: (input: LoginInput) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => Promise<void>
  deleteAccount: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const ME_QUERY_KEY = ['auth', 'me']

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  // null = still attempting a silent refresh from the httpOnly cookie on boot.
  const [hasSession, setHasSession] = useState<boolean | null>(null)

  useEffect(() => {
    tryRestoreSession().then(setHasSession)
  }, [])

  const meQuery = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: authApi.fetchCurrentUser,
    enabled: hasSession === true,
    retry: false,
    staleTime: 5 * 60_000,
  })

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (user) => {
      setHasSession(true)
      queryClient.setQueryData(ME_QUERY_KEY, user)
    },
  })

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (user) => {
      setHasSession(true)
      queryClient.setQueryData(ME_QUERY_KEY, user)
    },
  })

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      setHasSession(false)
      queryClient.clear()
    },
  })

  const deleteAccountMutation = useMutation({
    mutationFn: authApi.deleteAccount,
    onSuccess: () => {
      setHasSession(false)
      queryClient.clear()
    },
  })

  const value: AuthContextValue = {
    user: meQuery.data ?? null,
    isLoading: hasSession === null || (hasSession && meQuery.isLoading),
    login: async (input) => {
      await loginMutation.mutateAsync(input)
    },
    register: async (input) => {
      await registerMutation.mutateAsync(input)
    },
    logout: async () => {
      await logoutMutation.mutateAsync()
    },
    deleteAccount: async () => {
      await deleteAccountMutation.mutateAsync()
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- the hook belongs next to its provider
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
