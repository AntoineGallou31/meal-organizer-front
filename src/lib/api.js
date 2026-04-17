const API_URL = import.meta.env.VITE_API_URL ?? 'https://meal-organizer-back.onrender.com'

function normalizeRecipe(recipe) {
  if (!recipe) {
    return recipe
  }

  const categories = Array.isArray(recipe.categories)
    ? recipe.categories
    : Array.isArray(recipe.recipe_categories)
      ? recipe.recipe_categories.map((relation) => relation?.categories).filter(Boolean)
      : []

  const months = Array.isArray(recipe.months)
    ? recipe.months
    : Array.isArray(recipe.seasons)
      ? recipe.seasons
      : []

  const instructions = Array.isArray(recipe.instructions)
    ? recipe.instructions
    : Array.isArray(recipe.steps)
      ? recipe.steps
      : []

  const primaryCategory = recipe.category ?? categories.find((category) => category && !category.is_default)?.name ?? categories[0]?.name ?? null

  const similarRecipes = Array.isArray(recipe.similar_recipes)
    ? recipe.similar_recipes.map(normalizeRecipe)
    : Array.isArray(recipe.similarRecipes)
      ? recipe.similarRecipes.map(normalizeRecipe)
      : []

  return {
    ...recipe,
    image: recipe.image ?? recipe.imageUrl ?? recipe.image_url ?? null,
    imageUrl: recipe.imageUrl ?? recipe.image_url ?? null,
    category: primaryCategory,
    prepTime: recipe.prepTime ?? recipe.prep_time ?? null,
    duration: recipe.duration ?? recipe.prepTime ?? recipe.prep_time ?? null,
    sourceUrl: recipe.sourceUrl ?? recipe.source_url ?? null,
    createdAt: recipe.createdAt ?? recipe.created_at ?? null,
    type: recipe.type ?? null,
    externalOnly: Boolean(recipe.externalOnly ?? recipe.external_only),
    incoherentImport: Boolean(recipe.incoherentImport ?? recipe.incoherent_import),
    restrictedDetail: Boolean(recipe.restrictedDetail ?? recipe.restricted_detail),
    importValidation: recipe.importValidation ?? recipe.import_validation ?? null,
    categories,
    months,
    instructions,
    steps: instructions,
    confidence: recipe.confidence ?? null,
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

function normalizeRecipeListResponse(data) {
  if (Array.isArray(data)) {
    return {
      items: data.map(normalizeRecipe),
      page: 1,
      limit: data.length,
      hasMore: false,
    }
  }

  return {
    ...data,
    items: Array.isArray(data?.items) ? data.items.map(normalizeRecipe) : [],
  }
}

function normalizeMealPlanDays(data) {
  const normalizeMealPlanItem = (item) => {
    if (!item) return item

    return {
      ...item,
      recipeId: item.recipeId ?? item.recipe_id ?? null,
      createdAt: item.createdAt ?? item.created_at ?? null,
      recipe: normalizeRecipe(item.recipe),
    }
  }

  if (Array.isArray(data)) {
    return data.map((day) => ({
      ...day,
      lunchItems: Array.isArray(day.lunchItems)
        ? day.lunchItems.map(normalizeMealPlanItem)
        : Array.isArray(day.lunch_items)
          ? day.lunch_items.map(normalizeMealPlanItem)
          : [],
      dinnerItems: Array.isArray(day.dinnerItems)
        ? day.dinnerItems.map(normalizeMealPlanItem)
        : Array.isArray(day.dinner_items)
          ? day.dinner_items.map(normalizeMealPlanItem)
          : [],
    }))
  }

  if (data?.days && Array.isArray(data.days)) {
    return {
      ...data,
      days: data.days.map((day) => ({
        ...day,
        lunchItems: Array.isArray(day.lunchItems)
          ? day.lunchItems.map(normalizeMealPlanItem)
          : Array.isArray(day.lunch_items)
            ? day.lunch_items.map(normalizeMealPlanItem)
            : [],
        dinnerItems: Array.isArray(day.dinnerItems)
          ? day.dinnerItems.map(normalizeMealPlanItem)
          : Array.isArray(day.dinner_items)
            ? day.dinner_items.map(normalizeMealPlanItem)
            : [],
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
    let details = null

    try {
      const data = await response.json()
      details = data
      if (data?.message) {
        message = data.message
      } else if (data?.error) {
        message = data.error
      }
    } catch {
      // Keep default message when backend does not send JSON.
    }

    const apiError = new Error(message)
    apiError.status = response.status
    apiError.details = details
    throw apiError
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export const api = {
  getMealPlan: async (week) => normalizeMealPlanDays(await apiRequest(`/api/meal-plan?week=${week}`)),
  createMealPlanItem: ({ date, slot, type, recipeId, note, position }) =>
    apiRequest('/api/meal-plan/items', {
      method: 'POST',
      body: JSON.stringify({ date, slot, type, recipeId, note, position }),
    }),
  removeMealPlanItem: ({ id }) =>
    apiRequest(`/api/meal-plan/items/${id}`, {
      method: 'DELETE',
    }),
  clearMealSlot: ({ date, slot }) =>
    apiRequest(`/api/meal-plan/${date}/${slot}`, {
      method: 'DELETE',
    }),
  getRecipes: async (filters = {}) => {
    const data = await apiRequest(`/api/recipes${toQueryString(filters)}`)
    return Array.isArray(data) ? data.map(normalizeRecipe) : data
  },
  getRecipesPage: async (filters = {}) => normalizeRecipeListResponse(await apiRequest(`/api/recipes${toQueryString(filters)}`)),
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
  importRecipe: async (url, options = {}) => {
    const result = await apiRequest('/api/recipes/import', {
      method: 'POST',
      body: JSON.stringify({
        url,
        forceImportMode: options.forceImportMode ?? null,
      }),
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
}
