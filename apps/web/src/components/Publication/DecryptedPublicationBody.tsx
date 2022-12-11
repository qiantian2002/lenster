import IFramely from '@components/Shared/IFramely';
import Markup from '@components/Shared/Markup';
import PublicationContentShimmer from '@components/Shared/Shimmer/PublicationContentShimmer';
import { Card } from '@components/UI/Card';
import type { LensterPublication } from '@generated/types';
import { CollectionIcon, EyeIcon, UserAddIcon } from '@heroicons/react/outline';
import { LockClosedIcon } from '@heroicons/react/solid';
import { LensGatedSDK } from '@lens-protocol/sdk-gated';
import formatHandle from '@lib/formatHandle';
import getURLs from '@lib/getURLs';
import axios from 'axios';
import clsx from 'clsx';
import { LIT_PROTOCOL_ENVIRONMENT } from 'data/constants';
import type { PublicationMetadataV2Input } from 'lens';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { useProvider, useSigner } from 'wagmi';

interface Props {
  encryptedPublication: LensterPublication;
}

const DecryptedPublicationBody: FC<Props> = ({ encryptedPublication }) => {
  const { pathname } = useRouter();
  const [decryptedData, setDecryptedData] = useState<any>(null);
  const provider = useProvider();
  const { data: signer } = useSigner();

  const canDecrypt = encryptedPublication?.canDecrypt?.result;
  const showMore = encryptedPublication?.metadata?.content?.length > 450 && pathname !== '/posts/[id]';

  const getDecryptedData = async () => {
    if (!signer) {
      return;
    }

    const contentUri = encryptedPublication?.onChainContentURI;
    const { data } = await axios.get(contentUri);
    const sdk = await LensGatedSDK.create({ provider, signer, env: LIT_PROTOCOL_ENVIRONMENT as any });
    const { decrypted } = await sdk.gated.decryptMetadata(data);
    setDecryptedData(decrypted);
  };

  useEffect(() => {
    if (canDecrypt) {
      getDecryptedData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canDecrypt]);

  if (!canDecrypt) {
    return (
      <Card className="text-sm rounded-xl w-fit p-8 shadow-sm" onClick={(event) => event.stopPropagation()}>
        <div className="font-bold flex items-center space-x-2">
          <LockClosedIcon className="h-5 w-5 text-green-500" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-500 to-blue-500 font-black">
            Unlock this by...
          </span>
        </div>
        <div className="pt-3.5 space-y-2">
          <div className="flex items-center space-x-2">
            <CollectionIcon className="h-4 w-4" />
            <span>
              Collect this <b className="lowercase">{encryptedPublication?.__typename}</b>
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <UserAddIcon className="h-4 w-4" />
            <span>
              Follow <b>@{formatHandle(encryptedPublication?.profile?.handle)}</b>
            </span>
          </div>
        </div>
      </Card>
    );
  }

  if (!decryptedData) {
    return <PublicationContentShimmer />;
  }

  const publication: PublicationMetadataV2Input = decryptedData;

  return (
    <div className="break-words">
      <Markup
        className={clsx(
          { 'line-clamp-5': showMore },
          'whitespace-pre-wrap break-words leading-md linkify text-md'
        )}
      >
        {publication?.content}
      </Markup>
      {showMore && (
        <div className="mt-4 text-sm text-gray-500 font-bold flex items-center space-x-1">
          <EyeIcon className="h-4 w-4" />
          <Link href={`/posts/${encryptedPublication?.id}`}>Show more</Link>
        </div>
      )}
      {publication?.content
        ? getURLs(publication?.content)?.length > 0 && <IFramely url={getURLs(publication?.content)[0]} />
        : null}
    </div>
  );
};

export default DecryptedPublicationBody;