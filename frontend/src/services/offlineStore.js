const PREFIX = 'pf_offline_';
const QUEUE_KEY = `${PREFIX}queue`;

export const saveFormState = (formKey, data) => {
  try {
    localStorage.setItem(`${PREFIX}${formKey}`, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving form state:', error);
  }
};

export const loadFormState = (formKey) => {
  try {
    const data = localStorage.getItem(`${PREFIX}${formKey}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading form state:', error);
    return null;
  }
};

export const clearFormState = (formKey) => {
  try {
    localStorage.removeItem(`${PREFIX}${formKey}`);
  } catch (error) {
    console.error('Error clearing form state:', error);
  }
};

export const getOfflineQueue = () => {
  try {
    const queue = localStorage.getItem(QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch (error) {
    console.error('Error getting offline queue:', error);
    return [];
  }
};

export const queueOfflineSubmission = (endpoint, method, body) => {
  try {
    const queue = getOfflineQueue();
    queue.push({
      id: Date.now().toString(),
      endpoint,
      method,
      body,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Error queueing offline submission:', error);
  }
};

export const clearOfflineQueue = () => {
  try {
    localStorage.removeItem(QUEUE_KEY);
  } catch (error) {
    console.error('Error clearing offline queue:', error);
  }
};

export const retryOfflineQueue = async (apiFn) => {
  const queue = getOfflineQueue();
  if (queue.length === 0) return true;

  let allSuccess = true;
  const remainingQueue = [];

  for (const item of queue) {
    try {
      await apiFn(item.endpoint, item.method, item.body);
    } catch (error) {
      console.error(`Failed to retry queued submission ${item.id}:`, error);
      allSuccess = false;
      remainingQueue.push(item);
    }
  }

  if (remainingQueue.length > 0) {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(remainingQueue));
  } else {
    clearOfflineQueue();
  }

  return allSuccess;
};
