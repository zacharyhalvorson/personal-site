import Typography from "typography"
import gray from 'gray-percentage'

const fontStack = [
  "-apple-system",
  "BlinkMacSystemFont",
  "Segoe UI",
  "Roboto",
  "sans-serif",
  "Apple Color Emoji",
  "Segoe UI Emoji",
  "Segoe UI Symbol",
];

export default new Typography({
  baseFontSize: "16px",
  baseLineHeight: 1.666,
  scaleRatio: 2,
  headerWeight: 600,
  bodyWeight: 'normal',
  boldWeight: 600,
  blockMarginBottom: 1 / 2,
  baseParagraphSpacing: .5,
  headerFontFamily: fontStack,
  bodyFontFamily: fontStack,
  bodyGray: '20%',
  overrideStyles: ({ rhythm }) => ({
    a: {
      color: '#4078c0',
      textDecoration: 'none',
    },
    'a:hover,a:active': {
      textDecoration: 'underline',
    },
    blockquote: {
      borderLeft: `4px solid ${gray(87)}`,
      color: gray(47),
      marginTop: 0,
      marginRight: 0,
      marginLeft: 0,
      paddingLeft: `calc(${rhythm(1 / 2)} - 1px)`,
    },
  }),
})
