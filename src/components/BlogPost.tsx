import React from 'react';
import type { MainView } from '../types';
import { CheckIcon, SparklesIcon } from './icons/Icons';

interface BlogPostProps {
    onNavigate: (view: MainView) => void;
}

const BlogPost: React.FC<BlogPostProps> = ({ onNavigate }) => {
    // In a real blog, you'd fetch this content, but for this self-contained app, we'll define it here.
    return (
        <div className="bg-dark text-gray-300 animate-fade-in">
            <div className="relative py-16 sm:py-24 bg-secondary-dark/50 overflow-hidden">
                <div className="hidden lg:block lg:absolute lg:inset-y-0 lg:h-full lg:w-full">
                    <div className="relative h-full text-lg max-w-prose mx-auto" aria-hidden="true">
                        <svg className="absolute top-12 left-full transform translate-x-32" width="404" height="384" fill="none" viewBox="0 0 404 384">
                            <defs><pattern id="74b3499e-45de-4c0c-a181-22c8430f3083" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><rect x="0" y="0" width="4" height="4" className="text-gray-700" fill="currentColor" /></pattern></defs>
                            <rect width="404" height="384" fill="url(#74b3499e-45de-4c0c-a181-22c8430f3083)" />
                        </svg>
                    </div>
                </div>
                <div className="relative px-4 sm:px-6 lg:px-8">
                    <div className="text-lg max-w-prose mx-auto">
                        <h1>
                            <span className="block text-base text-center text-primary-light font-semibold tracking-wide uppercase">BrandGuard Guide</span>
                            <span className="mt-2 block text-3xl text-center leading-8 font-extrabold tracking-tight text-white sm:text-4xl">FTC Disclosure Rules 2024: The Complete Compliance Guide for Brand Partnerships</span>
                        </h1>
                        <p className="mt-8 text-xl text-gray-400 leading-8">
                            In the fast-paced world of influencer marketing, speed is everything. But moving fast without proper compliance is like driving a race car without a seatbelt. The U.S. Federal Trade Commission (FTC) isn't just making suggestions—they're enforcing rules with hefty penalties. For brands and agencies, understanding these rules isn't just good practice; it's essential for survival.
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-6 prose prose-invert prose-lg text-gray-400 mx-auto px-4">
                <p>
                    Every sponsored post, every affiliate link, every gifted product mention falls under the FTC's purview. Their core mission is to protect consumers from deceptive advertising. If a creator has a "material connection" to a brand they're promoting, that relationship **must** be disclosed clearly and conspicuously. Failure to do so can result in fines starting at over $50,000 per violation, along with significant damage to brand reputation.
                </p>

                <h2>The Cost of Getting It Wrong: Real-World Penalties</h2>
                <p>
                    The FTC has shown it's not afraid to take action. In a landmark case, they settled with Warner Bros. for failing to ensure that influencers, including the high-profile "PewDiePie," properly disclosed that they were paid to promote a video game. The settlement required Warner Bros. to implement a strict monitoring and review system—a costly and complex undertaking that could have been avoided.
                </p>
                <p>
                    More recently, the FTC sent warning letters to hundreds of celebrities, influencers, and brands, putting them on notice for non-compliant posts. These weren't just slaps on the wrist; they were clear signals of a widespread crackdown. The message is simple: "get your house in order, or we will do it for you." For a marketing agency, a single non-compliant post from one of its creators can trigger an audit that jeopardizes the entire business.
                </p>

                <figure className="my-8">
                    <div className="bg-secondary-dark p-6 rounded-lg border border-danger/50">
                        <blockquote className="text-center text-xl font-semibold leading-9 text-white not-prose">
                            <p>"If you endorse a product through social media, your endorsement message should make it obvious when you have a relationship with the brand."</p>
                        </blockquote>
                        <figcaption className="mt-4 text-center text-gray-500">- The Federal Trade Commission</figcaption>
                    </div>
                </figure>

                <h2>"Clear and Conspicuous": What It Actually Means</h2>
                <p>
                    This is the phrase the FTC uses most, and it's where most brands get into trouble. A disclosure is not "clear and conspicuous" if it's buried, ambiguous, or easily missed. Let's break it down:
                </p>
                <ul>
                    <li>
                        <strong>Placement is Paramount:</strong> A disclosure must be placed where consumers are likely to see it without having to click "more" or scroll. For Instagram captions, this means in the first three lines. For videos, it means in the video itself (vocally and visually) and in the description.
                    </li>
                    <li>
                        <strong>Unambiguous Language:</strong> The FTC wants simple, clear terms. <code className="font-bold text-primary-light">#ad</code>, <code className="font-bold text-primary-light">#sponsored</code>, and <code className="font-bold text-primary-light">"Paid Partnership"</code> are their preferred terms. Vague terms like <code className="text-yellow-400">#collab</code>, <code className="text-yellow-400">#sp</code>, or "Thanks, [Brand Name]!" are not sufficient and can be flagged as non-compliant.
                    </li>
                    <li>
                        <strong>Visual & Audio Disclosures:</strong> If the endorsement is in a video or an image (like Instagram Stories), the disclosure must be on the image or in the video itself. It should be superimposed long enough to be read and understood. For audio-only content like podcasts, it needs to be spoken.
                    </li>
                </ul>
                
                <div className="my-12 bg-dark p-8 rounded-lg border-2 border-primary/20">
                    <h3 className="text-2xl font-bold text-white not-prose text-center mb-6">The Ultimate Influencer Compliance Checklist</h3>
                    <ul className="space-y-4 not-prose">
                        <li className="flex items-start">
                            <CheckIcon className="w-6 h-6 text-success flex-shrink-0 mr-3 mt-1" />
                            <span>Is the disclosure placed <strong className="text-white">before the "more"</strong> button in the caption?</span>
                        </li>
                        <li className="flex items-start">
                            <CheckIcon className="w-6 h-6 text-success flex-shrink-0 mr-3 mt-1" />
                            <span>Does the post use a simple, unambiguous term like <strong className="text-white">#ad</strong> or <strong className="text-white">#sponsored</strong>?</span>
                        </li>
                         <li className="flex items-start">
                            <CheckIcon className="w-6 h-6 text-success flex-shrink-0 mr-3 mt-1" />
                            <span>For videos, is the disclosure made <strong className="text-white">both verbally and visually</strong> in the content itself?</span>
                        </li>
                        <li className="flex items-start">
                            <CheckIcon className="w-6 h-6 text-success flex-shrink-0 mr-3 mt-1" />
                            <span>Are all product claims <strong className="text-white">truthful and substantiated</strong>? (e.g., if you say "clinically proven," you need proof).</span>
                        </li>
                         <li className="flex items-start">
                            <CheckIcon className="w-6 h-6 text-success flex-shrink-0 mr-3 mt-1" />
                            <span>Does the post avoid making any misleading statements about the <strong className="text-white">results a typical user</strong> can expect?</span>
                        </li>
                    </ul>
                </div>
                
                <h2>The Velocity Killer: The Problem with Manual Review</h2>
                <p>
                    So, how do most agencies handle this? With slow, inconsistent, and fear-driven manual review cycles. A piece of content gets passed from account manager to legal, back to creative, and then to the client. This process is the enemy of velocity. It's:
                </p>
                <ul>
                    <li>
                        <strong>Slow:</strong> What should take minutes can take days or weeks, causing you to miss market opportunities.
                    </li>
                    <li>
                        <strong>Inconsistent:</strong> Different reviewers have different opinions, leading to ambiguous feedback and frustrating revisions.
                    </li>
                    <li>
                        <strong>Risky:</strong> Human error is inevitable. A single missed detail in a late-night review can put the entire campaign at risk.
                    </li>
                </ul>
                <p>
                    This friction doesn't just slow you down; it kills momentum and surrenders the market to faster, more agile competitors. To win, you need to move at the speed of the market, but you can't do that if you're constantly second-guessing your compliance.
                </p>

                <h2>The Solution: Go From Risk to Revenue in 60 Seconds</h2>
                <p>
                    This is why we built BrandGuard. We believe that compliance review shouldn't be a bottleneck; it should be an automated, data-driven checkpoint. Our Greenlight Engine analyzes content against FTC guidelines, brand safety rules, and your own custom campaign requirements in seconds.
                </p>

                <div className="my-10 text-center">
                    <div className="bg-secondary-dark p-8 rounded-lg shadow-xl border border-primary/30">
                        <h3 className="text-2xl font-bold text-white not-prose">Stop Guessing. Get an Instant Answer.</h3>
                        <p className="mt-2 text-gray-400">Paste any influencer caption into our free Public Audit Tool and get an instant compliance score. No credit card, no sign-up required.</p>
                        <button
                            onClick={() => onNavigate('dashboard')}
                            className="mt-6 inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white font-bold rounded-md hover:bg-primary-dark transition-transform transform hover:scale-105 text-lg"
                        >
                            <SparklesIcon />
                            Audit My Content For Free
                        </button>
                    </div>
                </div>

                <p>
                    By making manual pre-publication review unthinkable, we give you the confidence to ship campaigns faster, secure in the knowledge that you're protected. Stop letting compliance be the time thief that kills your momentum. It's time to activate your Greenlight Engine.
                </p>
            </div>
        </div>
    );
};

export default BlogPost;
