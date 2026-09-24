import {
  ArrowRight,
  Boxes,
  Building2,
  ChartNoAxesCombined,
  Check,
  CircleCheckBig,
  PackageCheck,
  Route,
  ShieldCheck,
  Users,
} from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    icon: Building2,
    title: 'Multi-business control',
    description:
      'Give every client a dedicated workspace while your team manages them from one command center.',
  },
  {
    icon: Boxes,
    title: 'Inventory you can trust',
    description:
      'Track stock across warehouses, businesses, and locations with clear, up-to-date visibility.',
  },
  {
    icon: Route,
    title: 'Smarter fulfillment',
    description:
      'Coordinate orders, suppliers, and deliveries before delays turn into client problems.',
  },
];

const workflow = [
  {
    number: '01',
    title: 'Connect each business',
    description:
      'Bring client operations, locations, and supply partners into their own secure workspace.',
  },
  {
    number: '02',
    title: 'Run every workflow',
    description:
      'Plan inventory, coordinate purchasing, and monitor fulfillment from one shared system.',
  },
  {
    number: '03',
    title: 'Improve at scale',
    description:
      'Spot bottlenecks across your network and turn live operational data into better decisions.',
  },
];

const Home = () => {
  return (
    <div className='overflow-hidden'>
      <section className='relative isolate'>
        <div
          aria-hidden='true'
          className='bg-primary/15 absolute top-0 left-1/2 -z-10 h-80 w-80 -translate-x-1/2 rounded-full blur-3xl md:h-125 md:w-125'
        />
        <div className='page-wrapper grid gap-14 py-16 md:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-20 lg:py-28'>
          <div className='max-w-3xl'>
            <h1 className='font-heading text-4xl leading-[1.08] font-semibold tracking-tight sm:text-5xl lg:text-6xl'>
              Run every client&apos;s supply chain{' '}
              <span className='text-primary'>from one place.</span>
            </h1>
            <p className='text-muted-foreground mt-6 max-w-2xl text-lg leading-8'>
              NexusSupply gives operators one clear view of inventory, orders,
              suppliers, and fulfillment across every business they serve.
            </p>
            <div className='mt-8 flex flex-col gap-3 sm:flex-row'>
              <Link
                href='/sign-up'
                className='bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold shadow-sm transition-colors'
              >
                Start managing smarter
                <ArrowRight className='size-4' />
              </Link>
              <Link
                href='/sign-in'
                className='border-border bg-background hover:bg-muted inline-flex h-11 items-center justify-center rounded-lg border px-5 text-sm font-semibold transition-colors'
              >
                Sign in to your workspace
              </Link>
            </div>
            <div className='text-muted-foreground mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm'>
              {['Fast setup', 'Secure workspaces', 'Built to scale'].map(
                (item) => (
                  <span
                    key={item}
                    className='flex items-center gap-2'
                  >
                    <Check className='text-primary size-4' />
                    {item}
                  </span>
                )
              )}
            </div>
          </div>

          <div className='relative mx-auto w-full max-w-xl'>
            <div
              aria-hidden='true'
              className='bg-primary absolute -inset-1 -z-10 rounded-3xl opacity-20 blur-xl'
            />
            <div className='border-border bg-card rounded-3xl border p-3 shadow-2xl shadow-black/10'>
              <div className='border-border overflow-hidden rounded-2xl border'>
                <div className='border-border bg-muted/40 flex items-center justify-between border-b px-5 py-4'>
                  <div>
                    <p className='text-muted-foreground text-xs font-medium'>
                      Network overview
                    </p>
                    <p className='mt-0.5 font-semibold'>Northstar Operations</p>
                  </div>
                  <div className='bg-background border-border flex -space-x-2 rounded-full border p-1'>
                    {['AC', 'BV', 'CM'].map((business) => (
                      <span
                        key={business}
                        className='border-background bg-primary/10 text-primary flex size-8 items-center justify-center rounded-full border-2 text-[10px] font-bold'
                      >
                        {business}
                      </span>
                    ))}
                  </div>
                </div>

                <div className='grid gap-3 p-4 sm:grid-cols-3'>
                  {[
                    {
                      label: 'Client businesses',
                      value: '12',
                      icon: Users,
                    },
                    {
                      label: 'Active orders',
                      value: '348',
                      icon: PackageCheck,
                    },
                    {
                      label: 'On-time rate',
                      value: '97.4%',
                      icon: ChartNoAxesCombined,
                    },
                  ].map(({ label, value, icon: Icon }) => (
                    <div
                      key={label}
                      className='bg-muted/50 rounded-xl p-4'
                    >
                      <Icon className='text-primary mb-4 size-5' />
                      <p className='text-2xl font-semibold tracking-tight'>
                        {value}
                      </p>
                      <p className='text-muted-foreground mt-1 text-xs'>
                        {label}
                      </p>
                    </div>
                  ))}
                </div>

                <div className='px-4 pb-4'>
                  <div className='bg-muted/30 border-border rounded-xl border p-4'>
                    <div className='mb-5 flex items-center justify-between'>
                      <div>
                        <p className='text-sm font-semibold'>Live operations</p>
                        <p className='text-muted-foreground text-xs'>
                          Across all managed businesses
                        </p>
                      </div>
                      <span className='bg-primary/10 text-primary rounded-full px-2.5 py-1 text-xs font-medium'>
                        All systems healthy
                      </span>
                    </div>
                    <div className='space-y-4'>
                      {[
                        {
                          name: 'Arbor & Co.',
                          detail: '2,410 units in transit',
                          width: 'w-[82%]',
                        },
                        {
                          name: 'Brightwell Goods',
                          detail: '1,780 units allocated',
                          width: 'w-[64%]',
                        },
                        {
                          name: 'Crest Manufacturing',
                          detail: '940 units ready',
                          width: 'w-[46%]',
                        },
                      ].map((business) => (
                        <div key={business.name}>
                          <div className='mb-1.5 flex items-center justify-between gap-4 text-xs'>
                            <span className='font-medium'>{business.name}</span>
                            <span className='text-muted-foreground'>
                              {business.detail}
                            </span>
                          </div>
                          <div className='bg-muted h-1.5 overflow-hidden rounded-full'>
                            <div
                              className={`bg-primary h-full rounded-full ${business.width}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className='border-border bg-card absolute -right-3 -bottom-7 hidden items-center gap-3 rounded-xl border p-3 shadow-lg sm:flex'>
              <span className='bg-emerald-500/10 flex size-9 items-center justify-center rounded-lg'>
                <CircleCheckBig className='size-5 text-emerald-600 dark:text-emerald-400' />
              </span>
              <div>
                <p className='text-xs font-semibold'>Shipment delivered</p>
                <p className='text-muted-foreground text-[11px]'>
                  Client updated automatically
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className='border-border bg-muted/30 border-y py-16 md:py-24'>
        <div className='page-wrapper'>
          <div className='mx-auto max-w-2xl text-center'>
            <p className='text-primary text-sm font-semibold tracking-wider uppercase'>
              Built for operators
            </p>
            <h2 className='font-heading mt-3 text-3xl font-semibold tracking-tight md:text-4xl'>
              Complexity in. Clarity out.
            </h2>
            <p className='text-muted-foreground mt-4 leading-7'>
              Replace disconnected spreadsheets and status calls with a system
              that keeps your team and every client aligned.
            </p>
          </div>
          <div className='mt-12 grid gap-5 md:grid-cols-3'>
            {features.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className='border-border bg-card rounded-2xl border p-6 shadow-sm'
              >
                <span className='bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl'>
                  <Icon className='size-5' />
                </span>
                <h3 className='mt-5 text-lg font-semibold'>{title}</h3>
                <p className='text-muted-foreground mt-2 text-sm leading-6'>
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className='page-wrapper py-16 md:py-24'>
        <div className='grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-20'>
          <div className='lg:sticky lg:top-28'>
            <p className='text-primary text-sm font-semibold tracking-wider uppercase'>
              One connected workflow
            </p>
            <h2 className='font-heading mt-3 text-3xl font-semibold tracking-tight md:text-4xl'>
              From onboarding to optimization.
            </h2>
            <p className='text-muted-foreground mt-4 leading-7'>
              Build a repeatable operating model without losing the details
              that make each client unique.
            </p>
          </div>
          <ol className='space-y-4'>
            {workflow.map((step) => (
              <li
                key={step.number}
                className='border-border bg-card grid gap-4 rounded-2xl border p-6 sm:grid-cols-[auto_1fr] sm:gap-6'
              >
                <span className='text-primary font-heading text-sm font-semibold'>
                  {step.number}
                </span>
                <div>
                  <h3 className='text-lg font-semibold'>{step.title}</h3>
                  <p className='text-muted-foreground mt-2 text-sm leading-6'>
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className='page-wrapper pb-16 md:pb-24'>
        <div className='bg-foreground text-background relative overflow-hidden rounded-3xl px-6 py-12 sm:px-10 md:px-14 md:py-16'>
          <div
            aria-hidden='true'
            className='bg-primary absolute -top-24 -right-20 size-72 rounded-full opacity-40 blur-3xl'
          />
          <div className='relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center'>
            <div className='max-w-2xl'>
              <div className='mb-4 flex items-center gap-2 text-sm font-medium opacity-70'>
                <ShieldCheck className='size-4' />
                Secure by design. Ready to grow.
              </div>
              <h2 className='font-heading text-3xl font-semibold tracking-tight md:text-4xl'>
                Give every business your best operation.
              </h2>
              <p className='mt-4 max-w-xl leading-7 opacity-70'>
                Bring your clients, team, and supply network together in
                NexusSupply.
              </p>
            </div>
            <Link
              href='/sign-up'
              className='bg-background text-foreground hover:bg-background/90 inline-flex h-11 w-fit items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold transition-colors'
            >
              Create your workspace
              <ArrowRight className='size-4' />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
