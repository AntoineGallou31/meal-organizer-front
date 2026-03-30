const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  })

  if (!response.ok) {
    let message = 'Une erreur est survenue.'

    try {
      const data = await response.json()
      if (data?.message) {
        message = data.message
      }
    } catch {
      // Keep default message when backend does not send JSON.
    }

    throw new Error(message)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export const api = {
  getMealPlan: (week) => apiRequest(`/api/meal-plan?week=${week}`),
  assignMeal: ({ date, slot, recipeId }) =>
    apiRequest('/api/meal-plan', {
      method: 'POST',
      body: JSON.stringify({ date, slot, recipeId }),
    }),
  removeMeal: ({ date, slot }) =>
    apiRequest(`/api/meal-plan/${date}/${slot}`, {
      method: 'DELETE',
    }),
  getRecipes: () => apiRequest('/api/recipes'),
  getRecipeById: (id) => apiRequest(`/api/recipes/${id}`),
  importRecipe: (url) =>
    apiRequest('/api/recipes/import', {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),
}
