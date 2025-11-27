import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  ExecutiveSummary, 
  Order, 
  WebProject 
} from '@/types/dashboard';
import { toast } from '@/hooks/use-toast';

interface JiraDataState {
  summary: ExecutiveSummary | null;
  orders: Order[];
  webProjects: WebProject[];
  customers: string[];
  agents: string[];
  accountManagers: string[];
  lastSynced: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: JiraDataState = {
  summary: null,
  orders: [],
  webProjects: [],
  customers: ['All Customers'],
  agents: ['All Agents'],
  accountManagers: ['All Account Managers'],
  lastSynced: null,
  isLoading: false,
  error: null,
};

export function useJiraData() {
  const [state, setState] = useState<JiraDataState>(initialState);

  const fetchDashboardData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('Fetching JIRA data...');
      
      const { data, error } = await supabase.functions.invoke('jira-sync', {
        body: { action: 'dashboard' },
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to fetch JIRA data');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to fetch JIRA data');
      }

      console.log('JIRA data received:', {
        orders: data.data.orders?.length,
        webProjects: data.data.webProjects?.length,
        customers: data.data.customers?.length,
      });

      setState({
        summary: data.data.summary,
        orders: data.data.orders || [],
        webProjects: data.data.webProjects || [],
        customers: data.data.customers || ['All Customers'],
        agents: data.data.agents || ['All Agents'],
        accountManagers: data.data.accountManagers || ['All Account Managers'],
        lastSynced: data.data.lastSynced,
        isLoading: false,
        error: null,
      });

      toast({
        title: "Data synced",
        description: `Successfully synced ${data.data.orders?.length || 0} orders from JIRA`,
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error fetching JIRA data:', errorMessage);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      toast({
        title: "Sync failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, []);

  const fetchFields = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('jira-sync', {
        body: { action: 'fields' },
      });

      if (error) throw error;
      return data?.fields || [];
    } catch (err) {
      console.error('Error fetching JIRA fields:', err);
      return [];
    }
  }, []);

  return {
    ...state,
    fetchDashboardData,
    fetchFields,
    refresh: fetchDashboardData,
  };
}
