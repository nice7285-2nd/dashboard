import Link from 'next/link';
import Image from 'next/image';
import Fishbone from '@/public/fishbone.svg';

export default function LevelupLogo() {
  return (
    <Link href="/">
      <div className="flex flex-row items-center text-white">
        <Image src={Fishbone} width="120" height="60" alt="Fishbone Image" />
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
