
import React, { useState } from 'react';
import type { MainView } from '../types';
import { CheckIcon, SparklesIcon } from './icons/Icons';

interface PricingPageProps {
  onNavigate: (view: MainView) => void;
}

const faqs = [
    {
        question: 'Is there a free trial?',
        answer: 'While we don\'t offer a traditional time-based trial, you can use our Public Audit Tool on the homepage to run 3 free scans per session. The Starter and Pro plans come with a 7-day money-back guarantee.'
    },
    {
        question: 'What happens if I go over my monthly scan limit?',
        answer: 'On the Starter and Pro plans, you will be notified when you approach your limit. You can choose to upgrade your plan mid-cycle or purchase additional scan packs to continue service without interruption.'
    },
    {
        question: 'Can I upgrade, downgrade, or cancel my plan?',
        answer: 'Absolutely. You can change your plan or cancel at any time from your account settings. Upgrades are applied instantly, while downgrades and cancellations take effect at the end of your current billing period.'
    },
    {
        question: 'Do you offer custom agency pricing?',
        answer: 'Yes. For agencies managing high volumes of content across many client accounts, our Enterprise plan offers volume discounts, dedicated support, and custom MSA terms.'
    }
];

const PricingPage: React.FC<PricingPageProps> = ({ onNavigate }) => {
    const [isAnnual, setIsAnnual] = useState(false);

    const pricingTiers = [
        {
            name: 'Agency Starter',
            price: { monthly: 97, annual: 97 * 12 * 0.8 },
            description: 'For boutique agencies or freelancers managing <5 active creators.',
            features: [
                '50 scans per month',
                'All content types (image/video/brief)',
                'Compliance scoring & violation flagging',
                'Email support'
            ],
            cta: 'Start Free Trial',
            isPopular: false,
        },
        {
            name: 'Agency Pro',
            price: { monthly: 297, annual: 297 * 12 * 0.8 },
            description: 'For growth agencies managing multiple brand partnerships and campaigns.',
            features: [
                '200 scans per month',
                'Everything in Starter, plus:',
                'Magic Fix (AI-powered revisions)',
                'Audit Trail Certificates',
                'Influencer & Brand Tracking',
                'Priority email + Slack support'
            ],
            cta: 'Start Free Trial',
            isPopular: true,
        },
        {
            name: 'Enterprise',
            price: { monthly: 'Custom', annual: 'Custom' },
            description: 'For large agencies with dedicated account management teams.',
            features: [
                'Unlimited scans',
                'Everything in Pro, plus:',
                'Dedicated account manager',
                'Custom compliance rule sets per client',
                'API access & integrations',
                'White-label certificates'
            ],
            cta: 'Get Custom Pricing',
            isPopular: false,
        }
    ];

    return (
        <div className="bg-dark text-gray-300 animate-fade-in">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-white">Pricing for High-Velocity Agencies</h1>
                    <p className="mt-4 text-lg sm:text-xl text-gray-400">
                        Eliminate the compliance bottleneck. Ship campaigns faster with predictable, transparent pricing.
                    </p>
                </div>

                <div className="mt-12 flex justify-center items-center gap-4">
                    <span className={`font-medium ${!isAnnual ? 'text-white' : 'text-gray-500'}`}>Monthly</span>
                    <button onClick={() => setIsAnnual(!isAnnual)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${isAnnual ? 'bg-primary' : 'bg-gray-600'}`}>
                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isAnnual ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                    <span className={`font-medium ${isAnnual ? 'text-white' : 'text-gray-500'}`}>
                        Annual <span className="text-sm text-primary-light">(Save 20%)</span>
                    </span>
                </div>

                <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
                    {pricingTiers.map(tier => (
                        <div key={tier.name} className={`bg-secondary-dark rounded-lg p-8 border ${tier.isPopular ? 'border-primary shadow-2xl shadow-primary/20' : 'border-gray-700'} flex flex-col`}>
                           {tier.isPopular && <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2"><span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-semibold bg-primary text-white">MOST POPULAR</span></div>}
                            <h3 className="text-2xl font-bold text-white">{tier.name}</h3>
                            <p className="mt-4 text-gray-400 flex-grow">{tier.description}</p>
                            
                            <div className="mt-6">
                                {/* FIX: Add type guard for `tier.price.annual` to ensure it's a number before performing arithmetic operations. */}
                                {typeof tier.price.monthly === 'number' && typeof tier.price.annual === 'number' ? (
                                    <>
                                        <span className="text-5xl font-extrabold text-white">${isAnnual ? Math.round(tier.price.annual / 12) : tier.price.monthly}</span>
                                        <span className="text-base font-medium text-gray-400">/mo</span>
                                        {isAnnual && <p className="text-sm text-gray-500">billed as ${Math.round(tier.price.annual)} per year</p>}
                                    </>
                                ) : (
                                     <span className="text-4xl font-extrabold text-white">{tier.price.monthly}</span>
                                )}
                            </div>
                            
                            <ul className="mt-8 space-y-4 text-sm">
                                {tier.features.map(feature => (
                                    <li key={feature} className="flex items-start">
                                        <CheckIcon className="flex-shrink-0 w-5 h-5 text-primary-light mr-3" />
                                        <span className="text-gray-300">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-auto pt-8">
                                {tier.name === 'Enterprise' ? (
                                    <a href="mailto:sales@brandguard.ai" className={`w-full inline-block text-center px-6 py-3 font-bold rounded-md transition-colors ${tier.isPopular ? 'bg-primary text-white hover:bg-primary-dark' : 'bg-secondary text-white hover:bg-secondary-light'}`}>
                                        {tier.cta}
                                    </a>
                                ) : (
                                    <button onClick={() => onNavigate('dashboard')} className={`w-full px-6 py-3 font-bold rounded-md transition-colors ${tier.isPopular ? 'bg-primary text-white hover:bg-primary-dark' : 'bg-secondary text-white hover:bg-secondary-light'}`}>
                                        {tier.cta}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="mt-20 max-w-4xl mx-auto text-center p-8 bg-secondary-dark rounded-lg border border-gray-700">
                    <h3 className="text-xl font-semibold text-white">Trusted by growth-focused agencies managing 100+ brand partnerships monthly.</h3>
                </div>

                <div className="mt-20 max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-white mb-10">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        {faqs.map((faq, i) => (
                           <details key={i} className="bg-secondary-dark p-6 rounded-lg border border-gray-700 cursor-pointer group">
                                <summary className="flex justify-between items-center font-semibold text-white text-lg">
                                    {faq.question}
                                    <span className="transform transition-transform duration-200 group-open:rotate-45">
                                        <SparklesIcon />
                                    </span>
                                </summary>
                                <p className="mt-4 text-gray-400">{faq.answer}</p>
                           </details>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PricingPage;
