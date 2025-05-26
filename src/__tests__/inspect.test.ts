// Note: Top-level imports of Subject or DEFAULT_NAME are avoided here
// to ensure tests use the fresh module loaded after jest.resetModules().

let Inspect: (store: Record<string, unknown>, keys?: string[]) => void;
let ActualSubject: typeof import('../subject').default;
let ACTUAL_DEFAULT_NAME: string;

describe('Inspect', () => {
  let consoleGroupCollapsedSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;
  let consoleGroupEndSpy: jest.SpyInstance;

  beforeEach(async () => {
    jest.resetModules(); // Crucial: Resets module cache

    // Dynamically import modules to get fresh instances
    const inspectModule = await import('../inspect');
    Inspect = inspectModule.default;
    const subjectModule = await import('../subject');
    ActualSubject = subjectModule.default;
    ACTUAL_DEFAULT_NAME = subjectModule.DEFAULT_NAME;

    // Mock console methods
    consoleGroupCollapsedSpy = jest.spyOn(console, 'groupCollapsed').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleGroupEndSpy = jest.spyOn(console, 'groupEnd').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks(); // Restore original console methods
  });

  // Test 1: Basic functionality with a flat store
  test('should log updates for a flat store', () => {
    const store = {
      nameSub: new ActualSubject('initialName', { name: 'actualNameKey' }),
      ageSub: new ActualSubject(30), // Unnamed, uses ACTUAL_DEFAULT_NAME internally
    };
    Inspect(store); // No keys, inspect all

    store.nameSub.next('newName');
    expect(consoleGroupCollapsedSpy).toHaveBeenCalledWith(
      expect.stringMatching(/store%c \.nameSub \(%c\d+(\.\d+)?s\) subs: 1 \/ count: 2/),
      expect.any(String), expect.any(String), expect.any(String)
    );
    expect(consoleLogSpy).toHaveBeenCalledWith('newName');
    expect(consoleGroupEndSpy).toHaveBeenCalledTimes(1);
    
    consoleGroupCollapsedSpy.mockClear(); consoleLogSpy.mockClear(); consoleGroupEndSpy.mockClear();

    store.ageSub.next(31);
    expect(consoleGroupCollapsedSpy).toHaveBeenCalledWith(
      expect.stringMatching(/store%c \.ageSub \(%c\d+(\.\d+)?s\) subs: 1 \/ count: 2/),
      expect.any(String), expect.any(String), expect.any(String)
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(31);
    expect(consoleGroupEndSpy).toHaveBeenCalledTimes(1);
  });

  // Test 2: Nested store structure
  test('should log updates for a nested store with correct paths', () => {
    const store = {
      user: { details: { name: new ActualSubject('initialName', { name: 'userName' }) } },
      settings: new ActualSubject({ theme: 'dark' }, { name: 'userSettings' }),
    };
    Inspect(store);

    store.user.details.name.next('newName');
    expect(consoleGroupCollapsedSpy).toHaveBeenCalledWith(
      expect.stringMatching(/store%c \.user\.details\.name \(%c\d+(\.\d+)?s\) subs: 1 \/ count: 2/),
      expect.any(String), expect.any(String), expect.any(String)
    );
    expect(consoleLogSpy).toHaveBeenCalledWith('newName');
    expect(consoleGroupEndSpy).toHaveBeenCalledTimes(1);

    consoleGroupCollapsedSpy.mockClear(); consoleLogSpy.mockClear(); consoleGroupEndSpy.mockClear();

    store.settings.next({ theme: 'light' });
    expect(consoleGroupCollapsedSpy).toHaveBeenCalledWith(
      expect.stringMatching(/store%c \.settings \(%c\d+(\.\d+)?s\) subs: 1 \/ count: 2/),
      expect.any(String), expect.any(String), expect.any(String)
    );
    expect(consoleLogSpy).toHaveBeenCalledWith({ theme: 'light' });
    expect(consoleGroupEndSpy).toHaveBeenCalledTimes(1);
  });

  // Test 3: `activated` flag
  test('activated flag prevents re-subscriptions on subsequent calls', () => {
    const store = { product: new ActualSubject('initialP', { name: 'prodName' }) };
    Inspect(store); // First call, activates inspection via inspectStoreRecursive

    store.product.next('newP1');
    expect(consoleGroupCollapsedSpy).toHaveBeenCalledTimes(1);
    expect(consoleLogSpy).toHaveBeenCalledWith('newP1');
    expect(consoleGroupEndSpy).toHaveBeenCalledTimes(1);
    
    consoleGroupCollapsedSpy.mockClear(); consoleLogSpy.mockClear(); consoleGroupEndSpy.mockClear();

    const store2 = { item: new ActualSubject('itemA', { name: 'itemSub' }) };
    Inspect(store2); // Second call to Inspect. Since `activated` is global and now true, inspectStoreRecursive is NOT called.

    store.product.next('newP2'); // This should still log from the first Inspect call's subscription
    expect(consoleGroupCollapsedSpy).toHaveBeenCalledTimes(1);
    expect(consoleLogSpy).toHaveBeenCalledWith('newP2');
    
    consoleGroupCollapsedSpy.mockClear(); consoleLogSpy.mockClear(); consoleGroupEndSpy.mockClear();

    store2.item.next('newItemB'); // This should NOT log because Inspect(store2) was a no-op
    expect(consoleGroupCollapsedSpy).not.toHaveBeenCalled();
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });

  // Test 4: Filtering by subject names (`keys` argument)
  test('should only log updates for subjects specified in `keys`', () => {
    const store = {
      alpha: new ActualSubject('A', { name: 'alphaSubject' }),
      beta: new ActualSubject('B', { name: 'betaSubject' }),
      gamma: new ActualSubject('G', { name: 'gammaSubject' }),
    };
    Inspect(store, ['alphaSubject', 'gammaSubject']);

    store.alpha.next('newA');
    expect(consoleGroupCollapsedSpy).toHaveBeenCalledTimes(1);
    expect(consoleLogSpy).toHaveBeenCalledWith('newA');
    consoleGroupCollapsedSpy.mockClear(); consoleLogSpy.mockClear(); consoleGroupEndSpy.mockClear();

    store.beta.next('newB'); // betaSubject is not in keys
    expect(consoleGroupCollapsedSpy).not.toHaveBeenCalled();
    expect(consoleLogSpy).not.toHaveBeenCalled();

    store.gamma.next('newG');
    expect(consoleGroupCollapsedSpy).toHaveBeenCalledTimes(1);
    expect(consoleLogSpy).toHaveBeenCalledWith('newG');
  });

  // Test 5: Subject without a name (uses ACTUAL_DEFAULT_NAME)
  test('should log unnamed subjects if keys array is not provided or empty', () => {
    const store = { unnamed: new ActualSubject('U') }; // Name will be ACTUAL_DEFAULT_NAME
    Inspect(store); // No keys

    store.unnamed.next('newU');
    expect(consoleGroupCollapsedSpy).toHaveBeenCalledWith(
      expect.stringMatching(new RegExp(`store%c \\.unnamed \\(%c\\d+(\\.\\d+)?s\\) subs: 1 \\/ count: 2`)),
      expect.any(String),expect.any(String),expect.any(String)
    );
    expect(consoleLogSpy).toHaveBeenCalledWith('newU');
  });

  test('should not log unnamed subjects if keys array is provided and does not contain ACTUAL_DEFAULT_NAME', () => {
    const store = {
      named: new ActualSubject('N', {name: 'namedSub'}),
      unnamed: new ActualSubject('U'), // Name is ACTUAL_DEFAULT_NAME
    };
    Inspect(store, ['namedSub']); // ACTUAL_DEFAULT_NAME is not in keys

    store.unnamed.next('newU_unlogged');
    expect(consoleGroupCollapsedSpy).not.toHaveBeenCalled();

    store.named.next('newN_logged');
    expect(consoleGroupCollapsedSpy).toHaveBeenCalledWith(
      expect.stringMatching(/store%c \.named \(%c\d+(\.\d+)?s\) subs: 1 \/ count: 2/),
      expect.any(String),expect.any(String),expect.any(String)
    );
    expect(consoleLogSpy).toHaveBeenCalledWith('newN_logged');
  });
  
  test('should log unnamed subjects if keys array is provided and contains ACTUAL_DEFAULT_NAME', () => {
    const store = {
      named: new ActualSubject('N', {name: 'namedSub'}),
      unnamed: new ActualSubject('U'), // Name is ACTUAL_DEFAULT_NAME
    };
    Inspect(store, [ACTUAL_DEFAULT_NAME, 'namedSub']);

    store.unnamed.next('newU_default_logged');
    expect(consoleGroupCollapsedSpy).toHaveBeenCalledWith(
      expect.stringMatching(new RegExp(`store%c \\.unnamed \\(%c\\d+(\\.\\d+)?s\\) subs: 1 \/ count: 2`)),
      expect.any(String),expect.any(String),expect.any(String)
    );
    expect(consoleLogSpy).toHaveBeenCalledWith('newU_default_logged');
    
    consoleGroupCollapsedSpy.mockClear(); consoleLogSpy.mockClear(); consoleGroupEndSpy.mockClear();
    
    store.named.next('newN_named_logged');
    expect(consoleGroupCollapsedSpy).toHaveBeenCalledWith(
      expect.stringMatching(/store%c \.named \(%c\d+(\.\d+)?s\) subs: 1 \/ count: 2/),
      expect.any(String),expect.any(String),expect.any(String)
    );
    expect(consoleLogSpy).toHaveBeenCalledWith('newN_named_logged');
  });
});
