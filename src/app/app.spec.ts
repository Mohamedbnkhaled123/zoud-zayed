import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { ChildrenComponent } from './components/children/children.component';
import { DataService } from './services/data.service';
import { AuthService } from './services/auth.service';
import { 
  normalizeArabicText, 
  areArabicNamesEqual, 
  doesArabicNameMatch, 
  formatArabicDate, 
  formatCurrency, 
  getArabicDayName,
  getTodayString, 
  formatDateKey 
} from './utils/arabic-utils';

// Polyfill localStorage in test environment if missing
const storageMap = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => storageMap.get(key) ?? null,
  setItem: (key: string, value: string) => storageMap.set(key, value),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear(),
  get length() { return storageMap.size; },
  key: (index: number) => Array.from(storageMap.keys())[index] ?? null
};

if (typeof globalThis.localStorage === 'undefined' || !globalThis.localStorage) {
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
    configurable: true
  });
}

describe('Arabic Utils', () => {
  it('should normalize different Arabic letter forms correctly', () => {
    expect(normalizeArabicText('أحمد')).toBe('احمد');
    expect(normalizeArabicText('إبراهيم')).toBe('ابراهيم');
    expect(normalizeArabicText('آمال')).toBe('امال');
    expect(normalizeArabicText('سارة')).toBe('ساره');
    expect(normalizeArabicText('علي')).toBe('علي');
    expect(normalizeArabicText('  محمود   علي  ')).toBe('محمود علي');
  });

  it('should strip Arabic diacritics (tashkeel) and tatweel', () => {
    expect(normalizeArabicText('مُحَمَّد')).toBe('محمد');
    expect(normalizeArabicText('أَحْمَدْ')).toBe('احمد');
    expect(normalizeArabicText('مـحـمـد')).toBe('محمد');
    expect(normalizeArabicText('ٱحمد')).toBe('احمد');
  });

  it('should match equivalent Arabic names including compound variations', () => {
    expect(areArabicNamesEqual('أحمد خالد عبدالستار', 'احمد خالد عبدالستار')).toBe(true);
    expect(areArabicNamesEqual('أحمد خالد عبد الستار', 'احمد خالد عبدالستار')).toBe(true);
    expect(areArabicNamesEqual('سارة محمود', 'ساره محمود')).toBe(true);
    expect(areArabicNamesEqual('محمد ياسين', 'محمد  ياسين')).toBe(true);
  });

  it('should match names across common honorific prefixes', () => {
    expect(areArabicNamesEqual('د. سارة محمود', 'سارة محمود')).toBe(true);
    expect(areArabicNamesEqual('دكتور حسام عادل', 'حسام عادل')).toBe(true);
    expect(areArabicNamesEqual('أ. محمد ياسين', 'محمد ياسين')).toBe(true);
  });

  it('should reject empty or sub-2-char input in doesArabicNameMatch', () => {
    expect(doesArabicNameMatch('', 'د. سارة محمود')).toBe(false);
    expect(doesArabicNameMatch(' ', 'د. سارة محمود')).toBe(false);
    expect(doesArabicNameMatch('د', 'د. سارة محمود')).toBe(false);
    expect(doesArabicNameMatch('سارة', 'د. سارة محمود')).toBe(true);
  });

  it('should format Arabic date with Arabic day and month names', () => {
    const formatted = formatArabicDate('2026-11-12');
    expect(formatted).toContain('نوفمبر');
    expect(formatted).toContain('2026');
  });

  it('should generate consistent local date keys avoiding timezone shifts', () => {
    const date = new Date(2026, 10, 15);
    expect(formatDateKey(date)).toBe('2026-11-15');
  });

  it('should format currency with Egyptian pound label', () => {
    const formatted = formatCurrency(1500);
    expect(formatted).toContain('ج.م');
  });
});

describe('DataService (Zero Dummy Data)', () => {
  let service: DataService;

  beforeEach(() => {
    storageMap.clear();
    TestBed.configureTestingModule({
      providers: [DataService]
    });
    service = TestBed.inject(DataService);
  });

  it('should start completely empty without any hardcoded dummy data', () => {
    expect(service.specialists().length).toBe(0);
    expect(service.children().length).toBe(0);
    expect(service.sessions().length).toBe(0);
    expect(service.settings().enablePriceCalculation).toBe(false);
    expect(service.settings().defaultSessionPrice).toBe(0);
  });

  it('should add a new child successfully', () => {
    const newChild = service.addChild({
      name: 'طارق زياد',
      age: 6,
      diagnosis: '',
      guardianName: 'زياد طارق',
      guardianPhone: '',
      specialistId: 'spec-1',
      notes: ''
    });

    expect(service.children().length).toBe(1);
    expect(newChild.name).toBe('طارق زياد');
    expect(service.getChildById(newChild.id)).toBeDefined();
  });

  it('should add a group of children in bulk', () => {
    const group = [
      {
        name: 'كريم حسني',
        age: 5,
        diagnosis: '',
        guardianName: '',
        guardianPhone: '',
        specialistId: '',
        notes: ''
      },
      {
        name: 'سلمى وائل',
        age: 6,
        diagnosis: '',
        guardianName: '',
        guardianPhone: '',
        specialistId: '',
        notes: ''
      }
    ];

    const added = service.addChildrenGroup(group);
    expect(added.length).toBe(2);
    expect(service.children().length).toBe(2);
    expect(service.children().some(c => c.name === 'كريم حسني')).toBe(true);
    expect(service.children().some(c => c.name === 'سلمى وائل')).toBe(true);
  });

  it('should record attendance (attended or absent) with date lookup', () => {
    const today = getTodayString();
    const spec = service.addSpecialist('سارة محمود', 'تخاطب', '');
    const child = service.addChild({
      name: 'يوسف أحمد',
      age: 5,
      diagnosis: '',
      guardianName: '',
      guardianPhone: '',
      specialistId: spec.id,
      notes: ''
    });

    const session = service.recordAttendance(child.id, spec.id, today, 'attended');
    expect(session.status).toBe('attended');

    const lookup = service.getSessionForChildAndDate(child.id, today);
    expect(lookup).toBeDefined();
    expect(lookup?.status).toBe('attended');

    const updated = service.recordAttendance(child.id, spec.id, today, 'absent');
    expect(updated.status).toBe('absent');
    expect(service.getTodaySessionForChild(child.id)?.status).toBe('absent');
  });

  it('should allow enabling session calculation without forcing a price', () => {
    const today = getTodayString();
    const spec = service.addSpecialist('سارة محمود', '', '');
    const child = service.addChild({
      name: 'يوسف',
      age: 5,
      diagnosis: '',
      guardianName: '',
      guardianPhone: '',
      specialistId: spec.id,
      notes: ''
    });
    service.recordAttendance(child.id, spec.id, today, 'attended');

    service.setPriceCalculationEnabled(true);
    expect(service.settings().enablePriceCalculation).toBe(true);
    expect(service.settings().defaultSessionPrice).toBe(0);
    expect(service.totalAttendedSessions()).toBe(1);
    expect(service.totalCalculatedEarnings()).toBe(0);

    // Optionally add a price later
    service.setDefaultSessionPrice(200);
    expect(service.totalCalculatedEarnings()).toBe(200);
  });

  it('should allow Admin to add a specialist with registration date', () => {
    const spec = service.addSpecialist('د. حسام عادل', 'تعديل سلوك', '01099887766', '2026-11-10');

    expect(service.specialists().length).toBe(1);
    expect(spec.name).toBe('د. حسام عادل');
    expect(spec.createdAt).toBe('2026-11-10');
    expect(spec.isPasswordSet).toBe(false);
  });
});

describe('AuthService', () => {
  let authService: AuthService;
  let dataService: DataService;

  beforeEach(() => {
    storageMap.clear();
    TestBed.configureTestingModule({
      providers: [AuthService, DataService]
    });
    dataService = TestBed.inject(DataService);
    authService = TestBed.inject(AuthService);
  });

  it('should start unauthenticated without dummy user auto-login', () => {
    expect(authService.currentUser()).toBeNull();
    expect(authService.isAuthenticated()).toBe(false);
  });

  it('should log in as single Admin Ahmed Khaled Abdel-Sattar with password 01098898774', () => {
    const wrong = authService.loginAsAdmin('wrong-pass');
    expect(wrong.success).toBe(false);
    expect(authService.isAuthenticated()).toBe(false);

    const result = authService.loginAsAdmin('01098898774');
    expect(result.success).toBe(true);
    expect(authService.currentUser()?.name).toBe('أحمد خالد عبدالستار');
    expect(authService.isAdmin()).toBe(true);
    expect(authService.currentUser()?.role).toBe('admin');
  });

  it('should find specialist by name with Arabic normalization and titles', () => {
    const spec = dataService.addSpecialist('د. أميرة الشاذلي', 'تخاطب', '01122334455');

    const found1 = authService.findSpecialistByName('اميرة الشاذلي');
    expect(found1).toBeDefined();
    expect(found1?.id).toBe(spec.id);

    const found2 = authService.findSpecialistByName('أَمِيرَة الشَّاذْلِي');
    expect(found2).toBeDefined();
    expect(found2?.id).toBe(spec.id);
  });

  it('should handle first-time specialist password setup and permanent login', () => {
    const spec = dataService.addSpecialist('هيثم سامي', 'تنمية مهارات', '');
    expect(spec.isPasswordSet).toBe(false);

    const success = authService.setPasswordAndLogin(spec.id, 'mySecretPass123');
    expect(success).toBe(true);

    expect(authService.currentUser()?.name).toBe('هيثم سامي');
    expect(authService.isSpecialist()).toBe(true);

    const updatedSpec = dataService.getSpecialistById(spec.id);
    expect(updatedSpec?.isPasswordSet).toBe(true);
    expect(updatedSpec?.password).toBe('mySecretPass123');
  });

  it('should support logging out cleanly', () => {
    authService.loginAsAdmin('01098898774');
    expect(authService.isAuthenticated()).toBe(true);

    authService.logout();
    expect(authService.currentUser()).toBeNull();
    expect(authService.isAuthenticated()).toBe(false);
  });

  it('should support unified login for admin and specialists without exposing admin mode', () => {
    // 1. Admin login via unified form
    const adminRes = authService.loginUnified('أحمد خالد عبدالستار', '01098898774');
    expect(adminRes.success).toBe(true);
    expect(authService.isAdmin()).toBe(true);
    authService.logout();

    // 2. Specialist first time password setting via unified form
    const spec = dataService.addSpecialist('فاطمة', 'تخاطب', '');
    const specRes = authService.loginUnified('فاطمة', 'fatmaPass');
    expect(specRes.success).toBe(true);
    expect(authService.currentUser()?.name).toBe('فاطمة');
    expect(authService.isSpecialist()).toBe(true);
    authService.logout();

    // 3. Specialist English name login with auto-transliteration
    const spec2 = dataService.addSpecialist('سارة محمود', 'تخاطب', '');
    authService.setPasswordAndLogin(spec2.id, 'saraPass123');
    authService.logout();

    const englishLoginRes = authService.loginUnified('Sara Mahmoud', 'saraPass123');
    expect(englishLoginRes.success).toBe(true);
    expect(authService.currentUser()?.name).toBe('سارة محمود');
    authService.logout();

    // 4. Admin English name login with auto-transliteration
    const adminEnglishRes = authService.loginUnified('Ahmed Khaled', '01098898774');
    expect(adminEnglishRes.success).toBe(true);
    expect(authService.isAdmin()).toBe(true);
  });
});

describe('ChildrenComponent Privacy & Specialist Isolation', () => {
  let authService: AuthService;
  let dataService: DataService;

  beforeEach(() => {
    storageMap.clear();
    TestBed.configureTestingModule({
      imports: [ChildrenComponent],
      providers: [AuthService, DataService]
    });
    authService = TestBed.inject(AuthService);
    dataService = TestBed.inject(DataService);
  });

  it('should not expose children when unauthenticated or to admin or across specialists', () => {
    const spec1 = dataService.addSpecialist('سارة', 'تخاطب', '');
    dataService.addChild({
      name: 'كريم',
      age: 5,
      diagnosis: '',
      guardianName: '',
      guardianPhone: '',
      specialistId: spec1.id,
      notes: ''
    });

    const fixture = TestBed.createComponent(ChildrenComponent);
    const comp = fixture.componentInstance;
    comp.selectDayFilter('all');

    // 1. Unauthenticated: 0 children visible
    expect(authService.isAuthenticated()).toBe(false);
    expect(comp.filteredChildren().length).toBe(0);

    // 2. Admin logged in: 0 children visible initially (cannot see specialist 1 children)
    authService.loginAsAdmin('01098898774');
    expect(authService.isAdmin()).toBe(true);
    expect(comp.filteredChildren().length).toBe(0);

    // Admin can also add their own children
    dataService.addChild({
      name: 'علي',
      age: 6,
      diagnosis: 'توحد',
      guardianName: 'محمد',
      guardianPhone: '01011111111',
      specialistId: authService.currentUser()!.id
    });
    expect(comp.filteredChildren().length).toBe(1);
    expect(comp.filteredChildren()[0].name).toBe('علي');

    // 3. Specialist 2 logged in: 0 children visible (cannot see Admin or Specialist 1 children)
    const spec2 = dataService.addSpecialist('محمود', 'سلوك', '');
    authService.setPasswordAndLogin(spec2.id, 'pass123');
    expect(authService.currentUser()?.id).toBe(spec2.id);
    expect(comp.filteredChildren().length).toBe(0);

    // 4. Specialist 1 logged in: sees only their own child
    authService.setPasswordAndLogin(spec1.id, 'pass123');
    expect(authService.currentUser()?.id).toBe(spec1.id);
    expect(comp.filteredChildren().length).toBe(1);
    expect(comp.filteredChildren()[0].name).toBe('كريم');
  });

  it('should automatically default day filter to today and classify children by scheduleDays', () => {
    const spec = dataService.addSpecialist('سارة', 'تخاطب', '');
    authService.setPasswordAndLogin(spec.id, 'pass123');

    const todayName = getArabicDayName();
    const otherDay = todayName === 'السبت' ? 'الأحد' : 'السبت';

    dataService.addChild({
      name: 'طفل اليوم',
      age: 5,
      diagnosis: '',
      guardianName: '',
      guardianPhone: '',
      specialistId: spec.id,
      scheduleDays: [todayName]
    });

    dataService.addChild({
      name: 'طفل يوم آخر',
      age: 6,
      diagnosis: '',
      guardianName: '',
      guardianPhone: '',
      specialistId: spec.id,
      scheduleDays: [otherDay]
    });

    const fixture = TestBed.createComponent(ChildrenComponent);
    const comp = fixture.componentInstance;

    // Defaults to today's day automatically
    expect(comp.selectedDayFilter()).toBe(todayName);
    expect(comp.filteredChildren().length).toBe(1);
    expect(comp.filteredChildren()[0].name).toBe('طفل اليوم');

    // Switching to otherDay shows that day's child
    comp.selectDayFilter(otherDay);
    expect(comp.filteredChildren().length).toBe(1);
    expect(comp.filteredChildren()[0].name).toBe('طفل يوم آخر');

    // Switching to 'all' shows all children
    comp.selectDayFilter('all');
    expect(comp.filteredChildren().length).toBe(2);
  });
});

describe('App Component', () => {
  beforeEach(async () => {
    storageMap.clear();
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should default home page to children tab', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
    expect(app.currentTab()).toBe('children');
  });

  it('should render Zowad center header title without Wadaq', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const brandText = compiled.querySelector('.brand-name')?.textContent || '';
    expect(brandText).toContain('مركز زود للرعاية والتأهيل');
    expect(brandText).not.toContain('ودق');
    expect(brandText).not.toContain('وَدَق');
  });

  it('should render required footer attribution with Eng. Mohamed Khaled portfolio link and copyable phone', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const attribution = compiled.querySelector('.developer-attribution');
    expect(attribution).toBeTruthy();
    expect(attribution?.textContent).toContain('designed with Eng.Mohamed Khaled');
    expect(attribution?.textContent).toContain('01024891448');

    const link = compiled.querySelector('.attribution-link') as HTMLAnchorElement;
    expect(link?.href).toBe('https://mohamedkhaled-dev-portfolio.vercel.app/');

    const phoneBtn = compiled.querySelector('.phone-copy-pill');
    expect(phoneBtn).toBeTruthy();
  });

  it('should switch between tabs including days tab', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.setTab('days');
    expect(app.currentTab()).toBe('days');
  });
});

describe('Child Schedule Days & Attend/Cancel/No Show & Cover Sessions', () => {
  let dataService: DataService;

  beforeEach(() => {
    storageMap.clear();
    TestBed.configureTestingModule({
      providers: [DataService]
    });
    dataService = TestBed.inject(DataService);
  });

  it('should support saving and updating child weekly scheduleDays', () => {
    const child = dataService.addChild({
      name: 'عمر شريف',
      age: 7,
      diagnosis: 'فرط حركة',
      guardianName: '',
      guardianPhone: '',
      specialistId: 'spec-1',
      notes: '',
      scheduleDays: ['السبت', 'الإثنين', 'الأربعاء']
    });

    expect(child.scheduleDays).toEqual(['السبت', 'الإثنين', 'الأربعاء']);
    const fetched = dataService.getChildById(child.id);
    expect(fetched?.scheduleDays).toContain('السبت');
    expect(fetched?.scheduleDays).toContain('الأربعاء');

    // Update schedule
    dataService.updateChild({
      ...child,
      scheduleDays: ['الأحد', 'الثلاثاء']
    });
    const updated = dataService.getChildById(child.id);
    expect(updated?.scheduleDays).toEqual(['الأحد', 'الثلاثاء']);
  });

  it('should support Attend, Cancel, No Show attendance statuses', () => {
    const today = getTodayString();
    const child = dataService.addChild({
      name: 'زين أحمد',
      age: 4,
      diagnosis: '',
      guardianName: '',
      guardianPhone: '',
      specialistId: 'spec-1',
      notes: ''
    });

    // 1. Attend
    const s1 = dataService.recordAttendance(child.id, 'spec-1', today, 'attended');
    expect(s1.status).toBe('attended');

    // 2. Cancel
    const s2 = dataService.recordAttendance(child.id, 'spec-1', today, 'cancelled');
    expect(s2.status).toBe('cancelled');

    // 3. No Show (absent)
    const s3 = dataService.recordAttendance(child.id, 'spec-1', today, 'absent');
    expect(s3.status).toBe('absent');
  });

  it('should allow clearing accidental attendance completely', () => {
    const today = getTodayString();
    const child = dataService.addChild({
      name: 'ليلى هاني',
      age: 5,
      diagnosis: '',
      guardianName: '',
      guardianPhone: '',
      specialistId: 'spec-1',
      notes: ''
    });

    // Mark attended by mistake
    dataService.recordAttendance(child.id, 'spec-1', today, 'attended');
    expect(dataService.getSessionForChildAndDate(child.id, today)).toBeDefined();

    // Cancel / remove accidental attendance
    const removed = dataService.removeAttendance(child.id, today);
    expect(removed).toBe(true);
    expect(dataService.getSessionForChildAndDate(child.id, today)).toBeUndefined();
  });

  it('should record cover session for absent colleague with isCover and colleague name', () => {
    const today = getTodayString();
    const child = dataService.addChild({
      name: 'أحمد ماهر',
      age: 6,
      diagnosis: 'تأخر نمو لغوي',
      guardianName: '',
      guardianPhone: '',
      specialistId: 'spec-colleague',
      notes: ''
    });

    const coverSession = dataService.recordAttendance(
      child.id,
      'spec-covering',
      today,
      'attended',
      250,
      'جلسة تغطية لغياب الزميل',
      true,
      'د. حسام عادل',
      'spec-colleague'
    );

    expect(coverSession.isCover).toBe(true);
    expect(coverSession.coveredSpecialistName).toBe('د. حسام عادل');
    expect(coverSession.coveredSpecialistId).toBe('spec-colleague');
    expect(coverSession.specialistId).toBe('spec-covering');
    expect(coverSession.price).toBe(250);
  });
});
