'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { setActiveBusiness } from '@/lib/businesses/actions';

type BusinessOption = {
  id: string;
  name: string;
};

type BusinessSwitcherProps = {
  activeBusinessId: string;
  businesses: BusinessOption[];
};

const BusinessSwitcher = ({
  activeBusinessId,
  businesses,
}: BusinessSwitcherProps) => {
  const router = useRouter();
  const [value, setValue] = useState(activeBusinessId);
  const [isPending, startTransition] = useTransition();

  const changeBusiness = (businessId: string) => {
    const previous = value;
    setValue(businessId);

    startTransition(async () => {
      try {
        await setActiveBusiness(businessId);
        router.refresh();
      } catch {
        setValue(previous);
      }
    });
  };

  return (
    <div className='px-2 pb-2 group-data-[collapsible=icon]:hidden'>
      <label
        htmlFor='active-business'
        className='text-muted-foreground mb-1 block text-xs font-medium'
      >
        Active business
      </label>
      <NativeSelect
        id='active-business'
        aria-label='Active business'
        value={value}
        disabled={isPending}
        onChange={(event) => changeBusiness(event.target.value)}
        className='w-full'
      >
        {businesses.map((business) => (
          <NativeSelectOption
            key={business.id}
            value={business.id}
          >
            {business.name}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );
};

export default BusinessSwitcher;
