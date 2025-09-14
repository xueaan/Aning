import React from 'react';

// 性能监控工具
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private timers = new Map<string, number>();
  private metrics = new Map<string, number[]>();

  static getInstance() {
    if (!this.instance) {
      this.instance = new PerformanceMonitor();
    }
    return this.instance;
  }

  // 开始计时
  start(label: string) {
    this.timers.set(label, performance.now());
  }

  // 结束计时
  end(label: string) {
    const startTime = this.timers.get(label);
    if (startTime) {
      const duration = performance.now() - startTime;
      
      if (!this.metrics.has(label)) {
        this.metrics.set(label, []);
      }
      this.metrics.get(label)!.push(duration);
      this.timers.delete(label);
      
      return duration;
    }
    return 0;
  }

  // 获取平均耗时
  getAverageTime(label: string): number {
    const times = this.metrics.get(label) || [];
    return times.length > 0 ? times.reduce((a, b) => a + b) / times.length : 0;
  }

  // 清除指标
  clear(label?: string) {
    if (label) {
      this.metrics.delete(label);
      this.timers.delete(label);
    } else {
      this.metrics.clear();
      this.timers.clear();
    }
  }

  // 获取所有指标
  getMetrics() {
    const result: Record<string, { count: number; average: number; total: number }> = {};
    
    for (const [label, times] of this.metrics.entries()) {
      const total = times.reduce((a, b) => a + b, 0);
      result[label] = {
        count: times.length,
        average: total / times.length,
        total
      };
    }
    
    return result;
  }
}

// 装饰器 - 用于自动监控函数性能
export function measurePerformance(_label: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    descriptor.value = function (...args: any[]) {
      const monitor = PerformanceMonitor.getInstance();
      const fullLabel = `${target.constructor.name}.${propertyName}`;
      monitor.start(fullLabel);
      
      try {
        const result = method.apply(this, args);
        
        // 处理 Promise
        if (result instanceof Promise) {
          return result.finally(() => {
            monitor.end(fullLabel);
          });
        }
        
        monitor.end(fullLabel);
        return result;
      } catch (error) {
        monitor.end(fullLabel);
        throw error;
      }
    };
  };
}

// React Hook - 用于监控组件渲染性能
export function usePerformanceMonitor(componentName: string) {
  const monitor = PerformanceMonitor.getInstance();
  
  React.useEffect(() => {
    monitor.start(`${componentName} mount`);
    return () => {
      monitor.end(`${componentName} unmount`);
    };
  }, [componentName]);

  React.useLayoutEffect(() => {
    monitor.start(`${componentName} render`);
    return () => {
      monitor.end(`${componentName} render`);
    };
  });
}