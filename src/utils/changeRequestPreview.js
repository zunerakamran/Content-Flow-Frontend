function normalizeContent(value) {
  if (value == null || value === '') return ''
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }
  return String(value)
}

function parseContentArray(str) {
  if (!str) return null
  if (Array.isArray(str)) return str
  if (typeof str === 'object') return null
  try {
    const parsed = JSON.parse(str)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function pickCurrentContent(item) {
  return item?.current_content
    ?? item?.original_content
    ?? item?.previous_content
    ?? item?.published_content
    ?? item?.live_content
    ?? null
}

function pickProposedContent(item) {
  return item?.proposed_content
    ?? item?.draft_content
    ?? item?.content
    ?? null
}

function pickSectionName(item, fallbackSection) {
  return item?.section_name
    ?? item?.section?.name
    ?? fallbackSection?.name
    ?? 'Section'
}

function editsFromRelation(req) {
  const relation = req.section_edits
    ?? req.sectionEdits
    ?? req.edits
    ?? req.change_request_edits

  if (!Array.isArray(relation) || relation.length === 0) return null

  return relation.map((item) => ({
    section_name: pickSectionName(item, item.section),
    current_content: pickCurrentContent(item),
    proposed_content: pickProposedContent(item),
  }))
}

function editsFromProposedContent(req) {
  const batch = parseContentArray(req.proposed_content)
  if (!batch) return null

  return batch.map((item) => ({
    section_name: pickSectionName(item, req.section),
    current_content: pickCurrentContent(item),
    proposed_content: pickProposedContent(item),
  }))
}

export function buildPreviewFromRequest(req) {
  const relationEdits = editsFromRelation(req)
  if (relationEdits?.length) {
    return { is_batch: true, edits: relationEdits }
  }

  const batchEdits = editsFromProposedContent(req)
  if (batchEdits?.length) {
    return { is_batch: true, edits: batchEdits }
  }

  const current = pickCurrentContent(req)
  const proposed = pickProposedContent(req)
  if (!proposed) return null

  return {
    is_batch: false,
    current_content: current,
    proposed_content: proposed,
  }
}

export function previewHasStoredSnapshot(preview) {
  if (!preview) return false

  if (preview.is_batch && Array.isArray(preview.edits)) {
    return preview.edits.some(
      (item) => pickCurrentContent(item) != null && pickProposedContent(item) != null
    )
  }

  return pickCurrentContent(preview) != null && pickProposedContent(preview) != null
}

export function previewSidesMatch(preview) {
  if (!preview) return false

  if (preview.is_batch && Array.isArray(preview.edits)) {
    return preview.edits.every(
      (item) => normalizeContent(pickCurrentContent(item)) === normalizeContent(pickProposedContent(item))
    )
  }

  return normalizeContent(pickCurrentContent(preview)) === normalizeContent(pickProposedContent(preview))
}

function mergeEdit(current, stored) {
  const storedCurrent = pickCurrentContent(stored)
  const storedProposed = pickProposedContent(stored)
  const liveCurrent = pickCurrentContent(current)
  const liveProposed = pickProposedContent(current)

  return {
    section_name: pickSectionName(stored, null) || pickSectionName(current, null),
    current_content: storedCurrent ?? liveCurrent,
    proposed_content: storedProposed ?? liveProposed,
  }
}

export function preferStoredPreview(apiPreview, storedPreview) {
  if (!storedPreview) return apiPreview
  if (!apiPreview) return storedPreview

  if (storedPreview.is_batch && apiPreview.is_batch) {
    const storedEdits = storedPreview.edits || []
    const apiEdits = apiPreview.edits || []
    const mergedEdits = apiEdits.map((apiEdit, idx) => {
      const storedEdit = storedEdits[idx]
        ?? storedEdits.find((item) => pickSectionName(item) === pickSectionName(apiEdit))
      if (!storedEdit) return apiEdit

      const storedCurrent = pickCurrentContent(storedEdit)
      const apiCurrent = pickCurrentContent(apiEdit)
      const apiProposed = pickProposedContent(apiEdit)
      const storedProposed = pickProposedContent(storedEdit)

      if (
        storedCurrent != null
        && normalizeContent(storedCurrent) !== normalizeContent(storedProposed ?? apiProposed)
      ) {
        return mergeEdit(apiEdit, storedEdit)
      }

      if (
        storedCurrent != null
        && normalizeContent(apiCurrent) === normalizeContent(apiProposed)
        && normalizeContent(storedCurrent) !== normalizeContent(apiProposed)
      ) {
        return mergeEdit(apiEdit, storedEdit)
      }

      return apiEdit
    })

    return { ...apiPreview, is_batch: true, edits: mergedEdits }
  }

  if (!storedPreview.is_batch && !apiPreview.is_batch) {
    const storedCurrent = pickCurrentContent(storedPreview)
    const apiCurrent = pickCurrentContent(apiPreview)
    const apiProposed = pickProposedContent(apiPreview)

    if (
      storedCurrent != null
      && normalizeContent(apiCurrent) === normalizeContent(apiProposed)
      && normalizeContent(storedCurrent) !== normalizeContent(apiProposed)
    ) {
      return {
        ...apiPreview,
        current_content: storedCurrent,
        proposed_content: pickProposedContent(storedPreview) ?? apiProposed,
      }
    }
  }

  return apiPreview
}

export function isHistoricalRequest(req) {
  return ['approved', 'rejected', 'scheduled'].includes(req?.status)
}
