import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'

export default function IncompleteRecipeModal({ recipe, missingFields, onConfirm, onCancel, isLoading }) {
  const [editedRecipe, setEditedRecipe] = useState(recipe)

  const handleFieldChange = (field, value) => {
    setEditedRecipe((prev) => ({ ...prev, [field]: value }))
  }

  const handleConfirm = () => {
    onConfirm(editedRecipe)
  }

  const handleAddIngredient = () => {
    setEditedRecipe((prev) => ({
      ...prev,
      ingredients: [...(prev.ingredients || []), ''],
    }))
  }

  const handleAddStep = () => {
    setEditedRecipe((prev) => ({
      ...prev,
      steps: [...(prev.steps || []), ''],
    }))
  }

  const handleRemoveIngredient = (index) => {
    setEditedRecipe((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }))
  }

  const handleRemoveStep = (index) => {
    setEditedRecipe((prev) => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index),
    }))
  }

  const handleIngredientChange = (index, value) => {
    setEditedRecipe((prev) => {
      const newIngredients = [...prev.ingredients]
      newIngredients[index] = value
      return { ...prev, ingredients: newIngredients }
    })
  }

  const handleStepChange = (index, value) => {
    setEditedRecipe((prev) => {
      const newSteps = [...prev.steps]
      newSteps[index] = value
      return { ...prev, steps: newSteps }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40">
      <div className="w-full max-h-[90vh] overflow-y-auto rounded-t-3xl border border-cream-200 bg-cream-50 p-5 shadow-2xl">
        <div className="mb-4 space-y-2">
          <h2 className="text-xl font-bold text-sage-900">Recette incomplète</h2>
          <p className="text-sm text-sage-700">
            Certains champs sont manquants. Veuillez les renseigner ou annuler l'importation.
          </p>
        </div>

        <div className="space-y-4 mb-6">
          {/* Title field */}
          {missingFields.includes('title') && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-sage-800">
                <span className="text-red-600">*</span> Titre de la recette
              </label>
              <input
                type="text"
                value={editedRecipe.title || ''}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder="Ex: Pâtes à la carbonara"
                className="w-full rounded-xl border border-cream-300 bg-white px-3 py-2 text-sm text-sage-900 outline-none transition focus:border-sage-500"
              />
            </div>
          )}

          {/* Ingredients field */}
          {missingFields.includes('ingredients') && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-sage-800">
                <span className="text-red-600">*</span> Ingrédients
              </label>
              <div className="space-y-2">
                {(editedRecipe.ingredients || []).map((ingredient, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={ingredient}
                      onChange={(e) => handleIngredientChange(index, e.target.value)}
                      placeholder={`Ingrédient ${index + 1}`}
                      className="flex-1 rounded-xl border border-cream-300 bg-white px-3 py-2 text-sm text-sage-900 outline-none transition focus:border-sage-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(index)}
                      className="rounded-lg bg-red-100 px-2 py-2 text-sm text-red-700 transition hover:bg-red-200"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddIngredient}
                  className="w-full rounded-xl border border-dashed border-sage-300 bg-white px-3 py-2 text-sm font-semibold text-sage-700 transition hover:border-sage-500 hover:bg-cream-100"
                >
                  + Ajouter un ingrédient
                </button>
              </div>
            </div>
          )}

          {/* Steps field */}
          {missingFields.includes('steps') && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-sage-800">
                <span className="text-red-600">*</span> Étapes de préparation
              </label>
              <div className="space-y-2">
                {(editedRecipe.steps || []).map((step, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="mt-2 flex-shrink-0 text-sm font-semibold text-sage-500">{index + 1}.</span>
                    <textarea
                      value={step}
                      onChange={(e) => handleStepChange(index, e.target.value)}
                      placeholder={`Étape ${index + 1}`}
                      rows="2"
                      className="flex-1 rounded-xl border border-cream-300 bg-white px-3 py-2 text-sm text-sage-900 outline-none transition focus:border-sage-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveStep(index)}
                      className="flex-shrink-0 rounded-lg bg-red-100 px-2 py-2 text-sm text-red-700 transition hover:bg-red-200"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddStep}
                  className="w-full rounded-xl border border-dashed border-sage-300 bg-white px-3 py-2 text-sm font-semibold text-sage-700 transition hover:border-sage-500 hover:bg-cream-100"
                >
                  + Ajouter une étape
                </button>
              </div>
            </div>
          )}

          {/* Optional fields */}
          <div className="space-y-2 rounded-xl border border-cream-300 bg-white p-3">
            <label className="block text-sm font-semibold text-sage-800">Champs optionnels</label>
            
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-sage-700">Temps de préparation (minutes)</label>
              <input
                type="number"
                value={editedRecipe.prepTime || ''}
                onChange={(e) => handleFieldChange('prepTime', e.target.value ? parseInt(e.target.value) : '')}
                placeholder="Ex: 30"
                className="w-full rounded-lg border border-cream-300 bg-white px-3 py-2 text-sm text-sage-900 outline-none transition focus:border-sage-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-sage-700">Nombre de portions</label>
              <input
                type="number"
                value={editedRecipe.servings || ''}
                onChange={(e) => handleFieldChange('servings', e.target.value ? parseInt(e.target.value) : '')}
                placeholder="Ex: 4"
                className="w-full rounded-lg border border-cream-300 bg-white px-3 py-2 text-sm text-sage-900 outline-none transition focus:border-sage-500"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-2xl border border-sage-300 px-4 py-3 text-sm font-semibold text-sage-700 transition hover:bg-cream-100 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <ArrowLeft size={16} /> Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading || !editedRecipe.title || !editedRecipe.ingredients?.length || !editedRecipe.steps?.length}
            className="flex-1 rounded-2xl bg-sage-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sage-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? 'Importation...' : 'Importer la recette'}
          </button>
        </div>
      </div>
    </div>
  )
}
