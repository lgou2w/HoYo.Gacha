// import React from 'react'
// import { } from '@tanstack/react-router'
// import { makeStyles } from '@fluentui/react-components'
// import { DismissFilled } from '@fluentui/react-icons'
// import { appWindow } from '@tauri-apps/api/window'
// import Locale from '@/components/UI/Locale'

// const useStyles = makeStyles({
//   root: {
//     height: '100vh',
//     display: 'flex',
//     flexDirection: 'column',
//     justifyContent: 'center',
//     alignItems: 'center'
//   },
//   titlebar: {
//     position: 'fixed',
//     display: 'flex',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     height: '3rem',
//     borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
//   },
//   brand: {
//     flexGrow: 1,
//     display: 'inline-flex',
//     alignItems: 'center',
//     margin: '0 1rem',
//     fontWeight: 'bold',
//     userSelect: 'none',
//     pointerEvents: 'none' // Penetrates the mouse, triggering Tauri drag
//   },
//   buttons: {
//     display: 'inline-flex',
//     '& button': {
//       appearance: 'none',
//       border: 'none',
//       background: 'transparent',
//       minWidth: '3rem',
//       height: 'inherit',
//       padding: 0,
//       margin: 0,
//       '& svg': {
//         width: '1.25rem',
//         height: '1.25rem'
//       },
//       ':hover': {
//         background: 'red',
//         color: 'white'
//       }
//     }
//   },
//   content: {
//     maxHeight: '70%',
//     display: 'flex',
//     flexDirection: 'column',
//     rowGap: '1.5rem'
//   },
//   title: { fontSize: '1.875rem' },
//   subtitle: { fontSize: '1.25rem' },
//   error: {
//     overflow: 'auto',
//     background: 'rgba(0, 0, 0, 0.1)',
//     border: '1px solid rgba(0, 0, 0, 0.1)',
//     borderRadius: '4px',
//     '&::-webkit-scrollbar-thumb': { background: 'rgba(0, 0, 0, 0.25)' },
//     '& pre': {
//       whiteSpace: 'pre',
//       fontFamily: 'monospace',
//       padding: '1rem'
//     }
//   }
// })

// export default function ErrorPage () {
//   const classes = useStyles()
//   const error = useRouteError()
//   console.error('Oops!', error)

//   return (
//     <main className={classes.root}>
//       <div className={classes.titlebar} data-tauri-drag-region>
//         <div className={classes.brand}>{__APP_NAME__}</div>
//         <div className={classes.buttons}>
//           <button onClick={() => appWindow.close()}>
//             <DismissFilled />
//           </button>
//         </div>
//       </div>
//       <div className={classes.content}>
//         <div>
//           <Locale className={classes.title} component="h5" mapping={['Pages.ErrorPage.Title']} />
//           <Locale className={classes.subtitle} component="h6" mapping={['Pages.ErrorPage.Subtitle']} />
//         </div>
//         <div className={classes.error}>
//           <pre>
//             {stingifyError(error)}
//           </pre>
//         </div>
//       </div>
//     </main>
//   )
// }

// function stingifyError (error: ErrorResponse | Error | unknown): string {
//   if (isRouteErrorResponse(error)) {
//     return `${error.status} ${error.statusText}\n\n${String(error.data)}`
//   } else if (error instanceof Error) {
//     return error.stack || `${error.name}: ${error.message}`
//   } else {
//     return typeof error === 'string' ? error : String(error)
//   }
// }
