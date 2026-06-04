interface Props {
  size?: number
}

export default function GiftifyIcon({ size = 32 }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
    >
      <circle cx="50" cy="50" r="50" fill="#C2714F" />
      <text
        x="50"
        y="50"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
        fontSize="76"
        fontWeight="900"
        fill="#FAF6F1"
        textAnchor="middle"
        dominantBaseline="central"
      >
        G
      </text>
    </svg>
  )
}
