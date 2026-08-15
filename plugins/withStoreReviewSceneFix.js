/**
 * Expo config plugin: replace expo-store-review's SceneGeometry call.
 *
 * expo-store-review@57.0.2 calls `SceneGeometry.foregroundScene()`, which was added
 * to expo-modules-core after SDK 57 (PRs 48168 / 48318). The published
 * expo-modules-core@57.0.x does not export SceneGeometry, so EAS Xcode archive
 * fails with: cannot find 'SceneGeometry' in scope.
 *
 * Restore the UIKit connectedScenes lookup Expo used before that helper existed.
 */

const { withDangerousMod } = require('expo/config-plugins');
const fs = require('node:fs');
const path = require('node:path');

const BROKEN = '    return SceneGeometry.foregroundScene()';

const FIXED = `    if let activeScene = UIApplication.shared.connectedScenes.first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene {
      return activeScene
    }
    if let foregroundScene = UIApplication.shared.connectedScenes.first(where: {
      $0.activationState == .foregroundInactive
    }) as? UIWindowScene {
      return foregroundScene
    }
    return nil`;

const withStoreReviewSceneFix = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (mod) => {
      const filePath = path.join(
        mod.modRequest.projectRoot,
        'node_modules/expo-store-review/ios/StoreReviewModule.swift',
      );
      if (!fs.existsSync(filePath)) {
        return mod;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      if (!content.includes('SceneGeometry.foregroundScene()')) {
        return mod;
      }

      fs.writeFileSync(filePath, content.replace(BROKEN, FIXED), 'utf8');
      return mod;
    },
  ]);
};

module.exports = withStoreReviewSceneFix;
