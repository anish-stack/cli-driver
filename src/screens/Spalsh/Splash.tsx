
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import logo from '../../../assets/images/logo.png';
import { APP_NAME, APP_SLOGAN, APP_VERSION } from '../../../constant/details';
import { COLORS, SIZES, WEIGHTS, SPACING, RADIUS } from '../../../constant/ui';

const Splash: React.FC = () => {
    const { token, isAuthenticated } = useSelector((state: any) => state.login);
    const [loading, setLoading] = useState<boolean>(false);
    const navigation = useNavigation();

    useEffect(() => {
        const timer = setTimeout(() => {
            if (isAuthenticated && token) {
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Home' as never }],
                });
            } else {
                setLoading(false);
            }
        }, 2000);

        return () => clearTimeout(timer);
    }, [isAuthenticated, token, navigation]);

    const handleLogin = () => {
        navigation.navigate('login' as never);
    };

    const handleCreateAccount = () => {
        navigation.navigate('Register' as never);
    };

    if (loading || (isAuthenticated && token)) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
                <View style={styles.loadingContainer}>
                    <Image source={logo} style={styles.logo} resizeMode="contain" />
                    <Text style={styles.appName}>{APP_NAME}</Text>
                    <Text style={styles.appSlogan}>{APP_SLOGAN}</Text>
                    <Text style={styles.version}>v{APP_VERSION}</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />

            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <Image source={logo} style={styles.logo} resizeMode="contain" />
                    <Text style={styles.appName}>{APP_NAME}</Text>
                    <Text style={styles.appSlogan}>{APP_SLOGAN}</Text>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                        <Text style={styles.loginButtonText}>Login</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.createAccountButton} onPress={handleCreateAccount}>
                        <Text style={styles.createAccountButtonText}>Create Account</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.versionText}>v{APP_VERSION}</Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: scale(SPACING.xxl),
        paddingVertical: verticalScale(SPACING.xxxl),
    },
    logoContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: scale(120),
        height: scale(120),
        marginBottom: verticalScale(SPACING.xl),
    },
    appName: {
        fontSize: moderateScale(SIZES.title),
        fontWeight: WEIGHTS.bold,
        color: COLORS.primary,
        textAlign: 'center',
        marginBottom: verticalScale(SPACING.small),
    },
    appSlogan: {
        fontSize: moderateScale(SIZES.large),
        fontWeight: WEIGHTS.regular,
        color: COLORS.darkGray,
        textAlign: 'center',
        marginBottom: verticalScale(SPACING.xl),
    },
    version: {
        fontSize: moderateScale(SIZES.medium),
        fontWeight: WEIGHTS.light,
        color: COLORS.light,
        textAlign: 'center',
        marginTop: verticalScale(SPACING.xl),
    },
    buttonContainer: {
        width: '100%',
        paddingHorizontal: scale(SPACING.medium),
        marginBottom: verticalScale(SPACING.xl),
    },
    loginButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: verticalScale(SPACING.large),
        paddingHorizontal: scale(SPACING.xxl),
        borderRadius: moderateScale(RADIUS.large),
        marginBottom: verticalScale(SPACING.medium),
        shadowColor: COLORS.shadow,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    loginButtonText: {
        fontSize: moderateScale(SIZES.large),
        fontWeight: WEIGHTS.semiBold,
        color: COLORS.light,
        textAlign: 'center',
    },
    createAccountButton: {
        backgroundColor: COLORS.light,
        paddingVertical: verticalScale(SPACING.large),
        paddingHorizontal: scale(SPACING.xxl),
        borderRadius: moderateScale(RADIUS.large),
        borderWidth: 2,
        borderColor: COLORS.primary,
        shadowColor: COLORS.shadow,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    createAccountButtonText: {
        fontSize: moderateScale(SIZES.large),
        fontWeight: WEIGHTS.semiBold,
        color: COLORS.primary,
        textAlign: 'center',
    },
    versionText: {
        fontSize: moderateScale(SIZES.small),
        fontWeight: WEIGHTS.light,
        color: COLORS.gray,
        textAlign: 'center',
    },
});

export default Splash;