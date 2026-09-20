process.env.NODE_ENV = 'test'
import '@testing-library/jest-dom/vitest'

import * as axeMatchers from 'vitest-axe/matchers'
import { expect } from 'vitest'

expect.extend(axeMatchers)
