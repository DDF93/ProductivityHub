// Navigation types for our tab navigator
export type RootTabParamList = {
  Welcome: undefined;    
  Contacts: undefined;   
  Plugins: undefined;    
  Settings: undefined;   
};

// Navigation prop type for tab screens
export type TabNavigationProp = {
  navigate: (screen: keyof RootTabParamList) => void;
  goBack: () => void;
  // Add other navigation methods you might use
};