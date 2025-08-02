/**
 * 类型守卫和类型验证工具
 */

/**
 * 检查值是否为对象（非 null）
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 检查值是否为字符串
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * 检查值是否为数字
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number';
}

/**
 * 检查值是否为布尔值
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * 检查值是否为数组
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * 安全地获取对象属性
 */
export function getProperty<T>(
  obj: unknown,
  key: string,
  validator?: (value: unknown) => value is T
): T | undefined {
  if (!isObject(obj)) {
    return undefined;
  }
  
  const value = obj[key];
  
  if (validator) {
    return validator(value) ? value : undefined;
  }
  
  return value as T;
}

/**
 * 检查对象是否具有特定属性
 */
export function hasProperty(
  obj: unknown,
  key: string
): obj is Record<string, unknown> {
  return isObject(obj) && key in obj;
}

/**
 * 验证对象具有必需的属性
 */
export function hasRequiredProperties(
  obj: unknown,
  properties: string[]
): obj is Record<string, unknown> {
  if (!isObject(obj)) {
    return false;
  }
  
  return properties.every(prop => prop in obj);
}

/**
 * 类型断言辅助函数
 */
export function assertType<T>(
  value: unknown,
  validator: (value: unknown) => value is T,
  errorMessage: string
): T {
  if (!validator(value)) {
    throw new TypeError(errorMessage);
  }
  return value;
}

/**
 * 安全的 JSON 解析
 */
export function safeJsonParse(json: string): unknown {
  try {
    return JSON.parse(json);
  } catch {
    return undefined;
  }
}

/**
 * 将 unknown 类型转换为 Record<string, unknown>
 * 如果不是对象，返回空对象
 */
export function toRecord(value: unknown): Record<string, unknown> {
  return isObject(value) ? value : {};
}

/**
 * 将 unknown 类型转换为数组
 * 如果不是数组，返回空数组
 */
export function toArray(value: unknown): unknown[] {
  return isArray(value) ? value : [];
}