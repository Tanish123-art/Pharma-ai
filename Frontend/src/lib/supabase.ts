// Supabase client mock for FastAPI backend compatibility
// This file provides a Supabase-like interface but uses your FastAPI backend

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Mock Supabase auth object that works with your FastAPI backend
export const supabase = {
    auth: {
        // Sign out - clear token and reload
        signOut: async () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.reload();
            return { error: null };
        },

        // Get current session from localStorage
        getSession: async () => {
            const token = localStorage.getItem('token');
            const user = localStorage.getItem('user');

            if (token && user) {
                return {
                    data: {
                        session: {
                            access_token: token,
                            user: JSON.parse(user),
                        },
                    },
                    error: null,
                };
            }

            return { data: { session: null }, error: null };
        },

        // Sign in with email and password
        signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
            try {
                const response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (!response.ok) {
                    return { data: null, error: { message: data.detail || 'Login failed' } };
                }

                // Store token and user info
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('user', JSON.stringify(data.user));

                return {
                    data: {
                        session: {
                            access_token: data.access_token,
                            user: data.user,
                        },
                    },
                    error: null,
                };
            } catch (error) {
                return { data: null, error: { message: 'Network error' } };
            }
        },

        // Sign up with email and password
        signUp: async ({ email, password }: { email: string; password: string }) => {
            try {
                const response = await fetch(`${API_BASE_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (!response.ok) {
                    return { data: null, error: { message: data.detail || 'Registration failed' } };
                }

                // Auto-login after signup
                return await supabase.auth.signInWithPassword({ email, password });
            } catch (error) {
                return { data: null, error: { message: 'Network error' } };
            }
        },

        // Auth state change listener (simplified)
        onAuthStateChange: (callback: (event: string, session: any) => void) => {
            // Initial check
            supabase.auth.getSession().then(({ data }) => {
                if (data.session) {
                    callback('SIGNED_IN', data.session);
                } else {
                    callback('SIGNED_OUT', null);
                }
            });

            // Return unsubscribe function
            return {
                data: { subscription: { unsubscribe: () => { } } },
            };
        },
    },

    // Mock database methods
    from: (table: string) => {
        return {
            insert: async (data: any) => {
                console.log(`Mock DB Insert into ${table}:`, data);
                return { data: null, error: null };
            },
            select: (columns: string = '*') => {
                return {
                    eq: (column: string, value: any) => {
                        return {
                            single: async () => {
                                return { data: null, error: null };
                            },
                            order: (column: string, options: any) => {
                                return { data: [], error: null };
                            }
                        };
                    },
                    order: (column: string, options: any) => {
                        return { data: [], error: null };
                    }
                };
            }
        };
    }
};
