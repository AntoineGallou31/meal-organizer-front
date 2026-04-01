const API_URL = import.meta.env.VITE_API_URL ?? 'https://meal-organizer-back.onrender.com'

function normalizeRecipe(recipe) {
  if (!recipe) {
    return recipe
  }

  const categories = Array.isArray(recipe.categories)
    ? recipe.categories
    : []

  const seasons = Array.isArray(recipe.seasons)
    ? recipe.seasons
    : []

  const similarRecipes = Array.isArray(recipe.similar_recipes)
    ? recipe.similar_recipes.map(normalizeRecipe)
    : Array.isArray(recipe.similarRecipes)
      ? recipe.similarRecipes.map(normalizeRecipe)
      : []

  return {
    ...recipe,
    imageUrl: recipe.imageUrl ?? recipe.image_url ?? null,
    prepTime: recipe.prepTime ?? recipe.prep_time ?? null,
    sourceUrl: recipe.sourceUrl ?? recipe.source_url ?? null,
    createdAt: recipe.createdAt ?? recipe.created_at ?? null,
    type: recipe.type ?? null,
    externalOnly: Boolean(recipe.externalOnly ?? recipe.external_only),
    categories,
    seasons,
    similarRecipes,
  }
}

function toQueryString(params = {}) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    if (typeof value === 'string' && value.trim() === '') return
    searchParams.set(key, String(value))
  })

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

function normalizeMealPlanDays(data) {
  if (Array.isArray(data)) {
    return data.map((day) => ({
      ...day,
      lunch: normalizeRecipe(day.lunch),
      lunchManualText: day.lunchManualText ?? day.lunch_manual_text ?? null,
      dinner: normalizeRecipe(day.dinner),
      dinnerManualText: day.dinnerManualText ?? day.dinner_manual_text ?? null,
    }))
  }

  if (data?.days && Array.isArray(data.days)) {
    return {
      ...data,
      days: data.days.map((day) => ({
        ...day,
        lunch: normalizeRecipe(day.lunch),
        lunchManualText: day.lunchManualText ?? day.lunch_manual_text ?? null,
        dinner: normalizeRecipe(day.dinner),
        dinnerManualText: day.dinnerManualText ?? day.dinner_manual_text ?? null,
      })),
    }
  }

  return data
}

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
      } else if (data?.error) {
        message = data.error
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
  getMealPlan: async (week) => normalizeMealPlanDays(await apiRequest(`/api/meal-plan?week=${week}`)),
  assignMeal: ({ date, slot, recipeId, manualText }) =>
    apiRequest('/api/meal-plan', {
      method: 'POST',
      body: JSON.stringify({ date, slot, recipeId, manualText }),
    }),
  removeMeal: ({ date, slot }) =>
    apiRequest(`/api/meal-plan/${date}/${slot}`, {
      method: 'DELETE',
    }),
  getRecipes: async (filters = {}) => {
    const data = await apiRequest(`/api/recipes${toQueryString(filters)}`)
    return Array.isArray(data) ? data.map(normalizeRecipe) : data
  },
  getRecipeById: async (id) => normalizeRecipe(await apiRequest(`/api/recipes/${id}`)),
  createRecipe: async (payload) => normalizeRecipe(await apiRequest('/api/recipes', {
    method: 'POST',
    body: JSON.stringify(payload),
  })),
  updateRecipe: async (id, payload) => normalizeRecipe(await apiRequest(`/api/recipes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })),
  deleteRecipe: (id) => apiRequest(`/api/recipes/${id}`, {
    method: 'DELETE',
  }),
  importRecipe: async (url) => {
    const result = await apiRequest('/api/recipes/import', {
      method: 'POST',
      body: JSON.stringify({ url }),
    })
    return normalizeRecipe(result)
  },
  getCategories: (withCount = true) => apiRequest(`/api/categories${toQueryString({ withCount })}`),
  createCategory: (payload) => apiRequest('/api/categories', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  updateCategory: (id, payload) => apiRequest(`/api/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  deleteCategory: (id) => apiRequest(`/api/categories/${id}`, {
    method: 'DELETE',
  }),
  setRecipeCategories: (recipeId, categoryIds) => apiRequest(`/api/recipes/${recipeId}/categories`, {
    method: 'POST',
    body: JSON.stringify({ categoryIds }),
  }),
  getCategoryRecipes: async (categoryId, search = '') => {
    const data = await apiRequest(`/api/categories/${categoryId}/recipes${toQueryString({ search })}`)
    return Array.isArray(data) ? data.map(normalizeRecipe) : data
  },
  importPinterestExport: (payload) => apiRequest('/api/recipes/import-pinterest-export', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getImportStatus: (jobId) => apiRequest(`/api/recipes/import-status/${jobId}`),
}
