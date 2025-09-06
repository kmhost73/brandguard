import type { TestCase } from './types';

export const testCases: TestCase[] = [
  {
    id: 'text-pass-1',
    title: 'Test Case 1: Perfectly Compliant Text Post',
    description: 'This test checks if the AI correctly identifies a post that meets all standard requirements.',
    type: 'text',
    content: {
      text: '#ad So excited to share my new favorite sneakers! They are stylish, comfortable, and made with 100% organic materials. A must-have! #BrandPartner'
    },
    expected: {
      score: (actual) => actual >= 90,
      scoreText: '>= 90',
      summary: (actual) => actual.toLowerCase().includes('compliant'),
      checks: (actual) => {
        const ftc = actual.find(c => c.name.includes('FTC'));
        const claims = actual.find(c => c.name.includes('Claim'));
        return ftc?.status === 'pass' && claims?.status === 'pass';
      }
    }
  },
  {
    id: 'text-fail-1',
    title: 'Test Case 2: Blatant FTC Violation',
    description: 'This test ensures the AI catches a clear violation where no FTC disclosure is present.',
    type: 'text',
    content: {
      text: 'Just got these amazing new sneakers. They are made with 100% organic materials and feel incredible. You have to try them!'
    },
    expected: {
      score: (actual) => actual <= 50,
      scoreText: '<= 50',
      summary: (actual) => actual.toLowerCase().includes('not compliant') || actual.toLowerCase().includes('issue'),
      checks: (actual) => {
        const ftc = actual.find(c => c.name.includes('FTC'));
        return ftc?.status === 'fail';
      }
    }
  },
  {
    id: 'text-fail-2',
    title: 'Test Case 3: Missing Required Claim',
    description: 'This test ensures the AI fails a post that is missing a required product claim.',
    type: 'text',
    content: {
      text: '#sponsored My new shoes are great. Super comfy and they look cool too!'
    },
    expected: {
      score: (actual) => actual < 90,
      scoreText: '< 90',
      summary: (actual) => actual.toLowerCase().includes('not compliant') || actual.toLowerCase().includes('issue'),
      checks: (actual) => {
        const claims = actual.find(c => c.name.includes('Claim'));
        return claims?.status === 'fail';
      }
    }
  },
   {
    id: 'text-warn-1',
    title: 'Test Case 4: Buried FTC Disclosure',
    description: 'Tests if the AI can identify a disclosure that is not "clear and conspicuous" (buried in hashtags). This should trigger a warning.',
    type: 'text',
    content: {
      text: 'My new sneakers are made with 100% organic materials and I love them! #style #fashion #ootd #new #summer #ad'
    },
    expected: {
      score: (actual) => actual > 60 && actual < 90,
      scoreText: '60-90',
      summary: (actual) => actual.toLowerCase().includes('warning') || actual.toLowerCase().includes('improvement'),
      checks: (actual) => {
        const ftc = actual.find(c => c.name.includes('FTC'));
        return ftc?.status === 'warn';
      }
    }
  },
  {
    id: 'image-fail-1',
    title: 'Test Case 5: Image Post with Non-Compliant Caption',
    description: 'Tests the image analysis pipeline with a caption that has a clear FTC violation.',
    type: 'image',
    content: {
      text: 'Check out the new look! These shoes are made with 100% organic materials. So good!'
    },
    expected: {
      score: (actual) => actual <= 50,
      scoreText: '<= 50',
      summary: (actual) => actual.toLowerCase().includes('not compliant') || actual.toLowerCase().includes('issue'),
      checks: (actual) => {
        const ftc = actual.find(c => c.name.includes('FTC') && c.modality === 'text');
        return ftc?.status === 'fail';
      }
    }
  }
];