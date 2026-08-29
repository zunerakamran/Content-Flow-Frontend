export function sectionDisplayName(section) {
  if (!section) return 'Section'
  return section.display_name || section.name || 'Section'
}

export function isSectionVisible(section) {
  if (!section) return true
  return section.is_visible !== false
}
