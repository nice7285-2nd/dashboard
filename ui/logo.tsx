import Link from 'next/link';

export default function LevelupLogo() {
  return (
    <Link href="/">
      <div className="flex flex-row items-center text-white">
        <svg
          width="120"
          height="90"
          viewBox="0 0 500 300"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="30"
            y="40"
            width="80"
            height="60"
            fill="white"
            rx="10"
            ry="10"
          />
          <rect
            x="140"
            y="40"
            width="80"
            height="60"
            fill="white"
            rx="10"
            ry="10"
          />
          <rect
            x="250"
            y="40"
            width="80"
            height="60"
            fill="white"
            rx="10"
            ry="10"
          />

          <rect
            x="30"
            y="120"
            width="80"
            height="60"
            fill="#FFA500"
            rx="10"
            ry="10"
          />
          <rect
            x="140"
            y="120"
            width="80"
            height="60"
            fill="#FFA500"
            rx="10"
            ry="10"
          />
          <rect
            x="250"
            y="120"
            width="80"
            height="60"
            fill="blue"
            rx="10"
            ry="10"
          />
          <rect
            x="360"
            y="120"
            width="80"
            height="60"
            fill="blue"
            rx="10"
            ry="10"
          />

          <rect
            x="30"
            y="200"
            width="80"
            height="60"
            fill="white"
            rx="10"
            ry="10"
          />
          <rect
            x="140"
            y="200"
            width="80"
            height="60"
            fill="white"
            rx="10"
            ry="10"
          />
          <rect
            x="250"
            y="200"
            width="80"
            height="60"
            fill="white"
            rx="10"
            ry="10"
          />
        </svg>
        <div>
          <p className="hidden sm:block md:text-xl lg:text-xl xl:text-xl whitespace-nowrap">
            Fishbone <br />
            Workbooks
          </p>
          <p className="block text-xl sm:hidden whitespace-nowrap">
            Fishbone Workbooks
          </p>
        </div>
      </div>
    </Link>
  );
}
