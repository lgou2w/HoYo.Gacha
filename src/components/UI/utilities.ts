import { mergeClasses } from '@fluentui/react-components'

export function mergeComponentClasses (
  // HACK: As long as there is a className property
  component: { className?: string } | undefined | null,
  ...overrideClasses: (string | false | undefined)[]
) {
  if (component) {
    component.className = mergeClasses(
      component.className,
      ...overrideClasses,
    )
  }
}
