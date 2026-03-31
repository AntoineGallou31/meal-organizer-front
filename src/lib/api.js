const API_URL = import.meta.env.VITE_API_URL ?? 'https://meal-organizer-back.onrender.com'

function normalizeRecipe(recipe) {
  if (!recipe) {
    return recipe
  }

  return {
    ...recipe,
    imageUrl: recipe.imageUrl ?? recipe.image_url ?? null,
    prepTime: recipe.prepTime ?? recipe.prep_time ?? null,
    sourceUrl: recipe.sourceUrl ?? recipe.source_url ?? null,
    createdAt: recipe.createdAt ?? recipe.created_at ?? null,
  }
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
  getRecipes: async () => {
    const data = await apiRequest('/api/recipes')
    return Array.isArray(data) ? data.map(normalizeRecipe) : data
  },
  getRecipeById: async (id) => normalizeRecipe(await apiRequest(`/api/recipes/${id}`)),
  importRecipe: (url) =>
    apiRequest('/api/recipes/import', {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),
}
