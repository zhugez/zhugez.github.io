import type { FeatureFactory } from './room-feature';
import { turntableFeature } from './feature-turntable';
import { lampFeature } from './feature-lamp';
import { propsFeature } from './feature-props';
import { wallartFeature } from './feature-wallart';
import { ledsyncFeature } from './feature-ledsync';
import { desktopFeature } from './feature-desktop';
import { drawerFeature } from './feature-drawer';
import { backpackFeature } from './feature-backpack';

export const FEATURES: FeatureFactory[] = [turntableFeature, lampFeature, propsFeature, wallartFeature, ledsyncFeature, desktopFeature, drawerFeature, backpackFeature];
