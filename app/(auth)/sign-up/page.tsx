import CreateUserAccountForm from '@/components/auth/forms/CreateUserAccountForm';

const SignUpPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ callbackURL?: string }>;
}) => {
  const { callbackURL } = await searchParams;
  return (
    <div className='w-full'>
      <CreateUserAccountForm callbackURL={callbackURL} />
    </div>
  );
};

export default SignUpPage;
