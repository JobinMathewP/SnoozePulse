/**
 * Expo config plugin: disable SwiftUICore autolinking for Xcode 26 / iOS 26 SDK.
 *
 * iOS 26 split SwiftUI into a public `SwiftUI` framework and a private `SwiftUICore`
 * framework. Only Apple's own `SwiftUI` is an allowed client of `SwiftUICore`; third-party
 * apps cannot link it directly.
 *
 * Expo's auto-generated `ExpoModulesProvider.swift` imports SwiftUI-based modules, and the
 * Swift compiler emits a `-framework SwiftUICore` autolink directive into the app target's
 * own object files. The linker then rejects the build with:
 *
 *   cannot link directly with 'SwiftUICore' because product being built is not an allowed
 *   client of it
 *
 * This plugin injects `-Xfrontend -disable-autolink-framework -Xfrontend SwiftUICore` into
 * `OTHER_SWIFT_FLAGS` for both the app target(s) and every pod target, instructing the
 * Swift compiler to skip emitting the SwiftUICore autolink directive. SwiftUICore symbols
 * remain available at runtime through the SwiftUI framework, which IS an allowed client.
 *
 * Reference pattern: https://github.com/streamyfin/streamyfin/pull/1613
 */

const { withDangerousMod } = require('expo/config-plugins');
const fs = require('node:fs');
const path = require('node:path');

const MARKER = '# SnoozePulse SwiftUICore autolink fix (iOS 26 SDK)';

const patchSnippet = `
  ${MARKER}
  installer.aggregate_targets.each do |agg|
    next unless agg.user_project
    agg.user_project.native_targets.each do |target|
      target.build_configurations.each do |cfg|
        existing = cfg.build_settings['OTHER_SWIFT_FLAGS'] || '$(inherited)'
        existing = existing.join(' ') if existing.is_a?(Array)
        unless existing.include?('-disable-autolink-framework -Xfrontend SwiftUICore')
          cfg.build_settings['OTHER_SWIFT_FLAGS'] = existing + ' -Xfrontend -disable-autolink-framework -Xfrontend SwiftUICore'
        end
      end
    end
    agg.user_project.save
  end
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |cfg|
      existing = cfg.build_settings['OTHER_SWIFT_FLAGS'] || '$(inherited)'
      existing = existing.join(' ') if existing.is_a?(Array)
      unless existing.include?('-disable-autolink-framework -Xfrontend SwiftUICore')
        cfg.build_settings['OTHER_SWIFT_FLAGS'] = existing + ' -Xfrontend -disable-autolink-framework -Xfrontend SwiftUICore'
      end
    end
  end
`;

const withSwiftUICoreFix = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (mod) => {
      const podfilePath = path.join(mod.modRequest.platformProjectRoot, 'Podfile');
      let content = fs.readFileSync(podfilePath, 'utf8');

      if (content.includes(MARKER)) {
        return mod;
      }

      if (content.includes('post_install do |installer|')) {
        content = content.replace(
          'post_install do |installer|',
          `post_install do |installer|\n${patchSnippet}`,
        );
      } else {
        content += `\npost_install do |installer|\n${patchSnippet}\nend\n`;
      }

      fs.writeFileSync(podfilePath, content, 'utf8');
      return mod;
    },
  ]);
};

module.exports = withSwiftUICoreFix;
