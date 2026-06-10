import { useEffect, useRef } from 'react'

const RECIPE_REGEX = /\[@([^\]|]+)\|([^\]]+)\]/g

// Convertit le texte brut avec [@titre|id] en nœuds DOM
function buildNodes(text) {
  const nodes = []
  let lastIndex = 0
  let match
  RECIPE_REGEX.lastIndex = 0

  while ((match = RECIPE_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }
    nodes.push({ type: 'recipe', title: match[1], id: match[2] })
    lastIndex = RECIPE_REGEX.lastIndex
  }

  if (lastIndex < text.length) {
    nodes.push({ type: 'text', content: text.slice(lastIndex) })
  }

  return nodes
}

// Lit le contenu du div contentEditable et retourne le texte brut avec [@titre|id]
function readContent(div) {
  let result = ''
  for (const node of div.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      result += node.textContent
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const recipeData = node.dataset?.recipe
      if (recipeData) {
        result += recipeData
      } else if (node.tagName === 'BR') {
        result += '\n'
      } else {
        result += node.textContent
      }
    }
  }
  return result
}

// Synchronise le DOM du div avec le texte brut sans bouger le curseur inutilement
function syncDOM(div, text) {
  const nodes = buildNodes(text)

  // Construit la liste attendue de nœuds DOM
  const expected = []
  for (const node of nodes) {
    if (node.type === 'text') {
      // Découpe par \n pour gérer les sauts de ligne
      const lines = node.content.split('\n')
      lines.forEach((line, i) => {
        if (i > 0) expected.push({ kind: 'br' })
        if (line.length > 0) expected.push({ kind: 'text', content: line })
      })
    } else {
      expected.push({ kind: 'recipe', title: node.title, id: node.id, raw: `[@${node.title}|${node.id}]` })
    }
  }

  // Patch minimal : retire les nœuds en trop, met à jour ceux qui changent, ajoute les manquants
  let i = 0
  for (const exp of expected) {
    let current = div.childNodes[i]

    if (exp.kind === 'text') {
      if (!current || current.nodeType !== Node.TEXT_NODE) {
        div.insertBefore(document.createTextNode(exp.content), current ?? null)
      } else if (current.textContent !== exp.content) {
        current.textContent = exp.content
      }
    } else if (exp.kind === 'br') {
      if (!current || current.tagName !== 'BR') {
        div.insertBefore(document.createElement('br'), current ?? null)
      }
    } else if (exp.kind === 'recipe') {
      if (!current || current.dataset?.recipe !== exp.raw) {
        const span = document.createElement('span')
        span.contentEditable = 'false'
        span.dataset.recipe = exp.raw
        span.className =
          'inline-block font-semibold text-orange-600 bg-orange-50 rounded px-1 mx-0.5 select-none cursor-default'
        span.textContent = exp.title
        div.insertBefore(span, current ?? null)
      }
    }
    i++
  }

  // Supprime les nœuds en trop
  while (div.childNodes[i]) {
    div.removeChild(div.childNodes[i])
  }
}

export default function NoteEditor({ value, onChange, onBlur, placeholder, autoFocus }) {
  const divRef = useRef(null)
  // Garde une ref de la dernière valeur connue pour éviter les boucles
  const lastValueRef = useRef(value)

  // Initialise le DOM au montage
  useEffect(() => {
    if (!divRef.current) return
    syncDOM(divRef.current, value ?? '')
    if (autoFocus) {
      divRef.current.focus()
      // Place le curseur à la fin
      const range = document.createRange()
      const sel = window.getSelection()
      range.selectNodeContents(divRef.current)
      range.collapse(false)
      sel.removeAllRanges()
      sel.addRange(range)
    }
  }, [])

  // Synchronise le DOM quand value change depuis l'extérieur (ex: insertRecipe)
  useEffect(() => {
    if (!divRef.current) return
    if (value === lastValueRef.current) return
    lastValueRef.current = value

    // Sauvegarde et restaure la position du curseur
    const sel = window.getSelection()
    let savedOffset = null
    let savedNode = null
    if (sel && sel.rangeCount > 0 && divRef.current.contains(sel.anchorNode)) {
      savedNode = sel.anchorNode
      savedOffset = sel.anchorOffset
    }

    syncDOM(divRef.current, value ?? '')

    // Essaie de replacer le curseur à la fin si on ne peut pas restaurer précisément
    if (savedNode && divRef.current.contains(savedNode)) {
      try {
        const range = document.createRange()
        range.setStart(savedNode, Math.min(savedOffset, savedNode.textContent?.length ?? 0))
        range.collapse(true)
        sel.removeAllRanges()
        sel.addRange(range)
      } catch {}
    }
  }, [value])

  const handleInput = () => {
    if (!divRef.current) return
    const text = readContent(divRef.current)
    lastValueRef.current = text
    onChange(text)
  }

  const handleKeyDown = (e) => {
    if (e.key !== 'Backspace') return
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return
    const range = sel.getRangeAt(0)
    if (!range.collapsed) return

    // Si le curseur est juste après un token recette, on le supprime d'un coup
    const { startContainer, startOffset } = range
    if (startOffset === 0 && startContainer !== divRef.current) {
      const prev = startContainer.previousSibling
      if (prev && prev.dataset?.recipe) {
        e.preventDefault()
        prev.remove()
        const text = readContent(divRef.current)
        lastValueRef.current = text
        onChange(text)
      }
    }
  }

  return (
    <div className="relative">
      <div
        ref={divRef}
        contentEditable
        suppressContentEditableWarning
        className="w-full min-h-[4.5rem] p-2 text-sm font-normal focus:outline-none whitespace-pre-wrap break-words"
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onBlur={onBlur}
      />
      {(!value || value.length === 0) && (
        <div className="absolute top-2 left-2 text-sm text-sage-400 pointer-events-none select-none">
          {placeholder}
        </div>
      )}
    </div>
  )
}
